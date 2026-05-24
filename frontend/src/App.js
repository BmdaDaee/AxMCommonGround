
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const AuthContext = createContext(null);
const getStoredToken = () => localStorage.getItem("token") || localStorage.getItem("cg_session_token");

async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API}${path}`, { ...options, headers, credentials: "include" });
  const payload = (response.headers.get("content-type") || "").includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.detail || payload?.message || "Request failed");
  return payload;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    if (window.location.hash?.includes("session_id=")) { setLoading(false); return null; }
    if (!getStoredToken()) { setUser(null); setLoading(false); return null; }
    try { const profile = await apiFetch("/auth/me"); setUser(profile); return profile; }
    catch { setUser(null); return null; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refreshUser(); }, [refreshUser]);
  const logout = useCallback(async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("token"); localStorage.removeItem("cg_session_token"); setUser(null);
  }, []);
  return <AuthContext.Provider value={useMemo(() => ({ user, setUser, loading, refreshUser, logout }), [user, loading, refreshUser, logout])}>{children}</AuthContext.Provider>;
}
function useAuth(){ return useContext(AuthContext); }
function LoadingScreen(){ return <div className="cg-auth-screen" data-testid="loading-screen"><p className="cg-mono-label animate-pulse" data-testid="loading-message">Opening CommonGround...</p></div>; }
function ProtectedRoute({ children }) { const { user, loading } = useAuth(); const location = useLocation(); if (loading) return <LoadingScreen />; if (!user) return <Navigate to="/login" replace state={{ from: location }} />; return children; }

function AuthCallback(){
  const navigate = useNavigate(); const { setUser } = useAuth(); const processed = useRef(false);
  useEffect(() => {
    if (processed.current) return; processed.current = true;
    const sessionId = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("session_id");
    if (!sessionId) { navigate("/login", { replace: true }); return; }
    apiFetch("/auth/google/session", { method: "POST", body: JSON.stringify({ session_id: sessionId }) })
      .then((data) => { localStorage.setItem("token", data.session_token); setUser(data.user); navigate("/dashboard", { replace: true }); })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, setUser]);
  return <LoadingScreen />;
}

function GoogleButton({ label }){
  const click = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return <button type="button" onClick={click} className="cg-btn-secondary w-full" data-testid="google-login-button">{label}</button>;
}

function AuthPage({ mode }){
  const isSignup = mode === "signup"; const navigate = useNavigate(); const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    if (isSignup && form.password !== form.confirmPassword) { setError("Passwords do not match"); setBusy(false); return; }
    try {
      const payload = isSignup ? { name: form.name, email: form.email, password: form.password } : { email: form.email, password: form.password };
      const data = await apiFetch(isSignup ? "/auth/signup" : "/auth/login", { method: "POST", body: JSON.stringify(payload) });
      localStorage.setItem("token", data.session_token); setUser(data.user); navigate("/dashboard", { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="cg-auth-screen" data-testid={`${mode}-page`}><div className="cg-auth-card" data-testid="auth-form-card"><h1 data-testid="auth-heading">{isSignup ? "Join CommonGround" : "Sovereign Login"}</h1><p className="cg-muted text-center mb-8" data-testid="auth-description">{isSignup ? "Start your relational journey." : "Enter the shared space."}</p><GoogleButton label={isSignup ? "Sign up with Google" : "Continue with Google"} /><div className="cg-divider" data-testid="auth-divider">or</div><form onSubmit={submit} className="space-y-6" data-testid={`${mode}-form`}>{isSignup && <label className="cg-label" data-testid="signup-name-label">Name<input className="cg-input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required data-testid="signup-name-input" /></label>}<label className="cg-label" data-testid={`${mode}-email-label`}>Email<input type="email" className="cg-input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required data-testid={`${mode}-email-input`} /></label><label className="cg-label" data-testid={`${mode}-password-label`}>Password<input type="password" className="cg-input" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} minLength={isSignup ? 8 : undefined} required data-testid={`${mode}-password-input`} /></label>{isSignup && <label className="cg-label" data-testid="signup-confirm-label">Confirm Password<input type="password" className="cg-input" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} required data-testid="signup-confirm-input" /></label>}{error && <p className="cg-error" data-testid={`${mode}-error-message`}>{error}</p>}<button className="cg-btn-primary w-full" disabled={busy} data-testid={`${mode}-submit-button`}>{busy ? "Authenticating..." : isSignup ? "Sign Up" : "Enter Vault"}</button></form><p className="mt-6 text-center text-sm text-[#B0B0B0]" data-testid="auth-switch-text">{isSignup ? "Already have an account?" : "New to CommonGround?"} <Link to={isSignup ? "/login" : "/signup"} className="text-[#D4AF37] hover:underline" data-testid="auth-switch-link">{isSignup ? "Login" : "Create Account"}</Link></p></div></main>;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "◇", test: "dashboard" },
  { path: "/messages", label: "Messages", icon: "✉", test: "messages" },
  { path: "/bently", label: "Bently", icon: "◆", test: "bently" },
  { path: "/deeplyus", label: "DeeplyUs", icon: "♡", test: "deeplyus" },
  { path: "/journal", label: "Journal", icon: "◇", test: "journal" },
  { path: "/calendar", label: "Calendar", icon: "○", test: "calendar" },
  { path: "/xp", label: "Progress", icon: "✧", test: "xp" },
  { path: "/missions", label: "Missions", icon: "▪", test: "missions" },
  { path: "/settings", label: "Settings", icon: "⚙", test: "settings" },
];
function Layout(){
  const navigate = useNavigate(); const { logout } = useAuth();
  const doLogout = async()=>{ await logout(); navigate("/login"); };
  return <div className="cg-layout" data-testid="app-shell"><aside className="cg-sidebar" data-testid="sidebar-navigation"><div className="cg-side-head" data-testid="sidebar-header"><p>CommonGround</p><h1>A third<br/>presence.</h1></div><nav className="cg-nav" data-testid="main-navigation-links">{navItems.map((item)=><NavLink key={item.path} to={item.path} className={({isActive})=>`cg-nav-link ${isActive?"active":""}`} data-testid={`nav-link-${item.test}`}><span className="cg-nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav><div className="cg-sidebar-footer"><button onClick={doLogout} className="cg-logout" data-testid="logout-button">Logout</button></div></aside><main className="cg-main" data-testid="workspace-content"><Outlet /></main></div>;
}

function AiAvatarPanel({ interactive = false, compact = false }){
  const [assets,setAssets]=useState(null); const [form,setForm]=useState({prompt:'',zodiac_sign:'',style:'editorial mystical portrait'}); const [busy,setBusy]=useState(false);
  const load=useCallback(()=>apiFetch('/ai/assets').then(setAssets),[]); useEffect(()=>{load();},[load]);
  const generate=async()=>{setBusy(true); try{await apiFetch('/ai/avatar',{method:'POST',body:JSON.stringify(form)}); await load();}finally{setBusy(false);}};
  if(!assets) return <div className="cg-card cg-ai-card" data-testid="ai-avatar-loading"><p className="cg-mono-label animate-pulse">Loading AI portraits...</p></div>;
  return <div className={`cg-ai-grid ${compact?'compact':''}`} data-testid="ai-avatar-panel"><div className="cg-card cg-ai-card"><p className="cg-mono-label">User AI Avatar</p><img src={assets.user_avatar} alt="AI avatar portrait" data-testid="ai-user-avatar-image"/><p className="cg-muted">Your generated avatar replaces this placeholder across CommonGround.</p></div><div className="cg-card cg-ai-card"><p className="cg-mono-label">Couple Avatar Portrait</p><img src={assets.couple_portrait.image_url} alt="AI couple avatar portrait" data-testid="ai-couple-avatar-image"/><p className="cg-muted">Automatically composed from user avatar energy and pair context.</p></div>{interactive&&<div className="cg-card cg-ai-form" data-testid="ai-avatar-generator"><h3>Generate your avatar</h3><label className="cg-label">Zodiac sign<input className="cg-input" value={form.zodiac_sign} onChange={e=>setForm({...form,zodiac_sign:e.target.value})} placeholder="Cancer, Aries, Virgo..." data-testid="ai-avatar-zodiac-input"/></label><label className="cg-label">Portrait direction<textarea className="cg-textarea" value={form.prompt} onChange={e=>setForm({...form,prompt:e.target.value})} placeholder="Describe your avatar energy, style, mood, or relationship archetype..." data-testid="ai-avatar-prompt-input"/></label><button className="cg-btn-primary w-full" onClick={generate} disabled={busy} data-testid="ai-avatar-generate-button">{busy?'Generating...':'Generate Avatar'}</button></div>}</div>;
}

function HoroscopePanel({ compact = false }){
  const [form,setForm]=useState({zodiac_sign:'',partner_zodiac_sign:'',focus:'communication'}); const [reading,setReading]=useState(null); const [busy,setBusy]=useState(false);
  const generate=async()=>{setBusy(true); try{setReading(await apiFetch('/ai/horoscope',{method:'POST',body:JSON.stringify(form)}));}finally{setBusy(false);}};
  return <div className={`cg-card cg-horoscope ${compact?'compact':''}`} data-testid="horoscope-panel"><div className="flex justify-between gap-md mb-md"><div><p className="cg-mono-label">Astrology Layer</p><h3>Daily + Couple Horoscope</h3></div><button className="cg-btn-secondary" onClick={generate} disabled={busy} data-testid="horoscope-generate-button">{busy?'Reading...':'Generate'}</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md"><input className="cg-input" value={form.zodiac_sign} onChange={e=>setForm({...form,zodiac_sign:e.target.value})} placeholder="Your sign" data-testid="horoscope-user-sign-input"/><input className="cg-input" value={form.partner_zodiac_sign} onChange={e=>setForm({...form,partner_zodiac_sign:e.target.value})} placeholder="Partner sign" data-testid="horoscope-partner-sign-input"/><input className="cg-input" value={form.focus} onChange={e=>setForm({...form,focus:e.target.value})} placeholder="Focus" data-testid="horoscope-focus-input"/></div>{reading?<div className="cg-horoscope-grid"><article data-testid="horoscope-daily"><p className="cg-mono-label">Daily</p><p>{reading.daily}</p></article><article data-testid="horoscope-couple"><p className="cg-mono-label">Couple</p><p>{reading.couple}</p></article><article data-testid="horoscope-timing"><p className="cg-mono-label">Timing</p><p>{reading.timing}</p></article></div>:<p className="cg-muted" data-testid="horoscope-empty-state">Generate individual guidance, couple compatibility, and relationship timing.</p>}</div>;
}

const stateConfig = { DORMANT: { color: "#6B7280", label: "Dormant", description: "Things are stable but low-energy. The comfort is real — so is the drift." }, ALIGNED: { color: "#10B981", label: "Aligned", description: "Both of you are showing up. The channel is open." }, MISALIGNED: { color: "#F59E0B", label: "Misaligned", description: "You have capacity. Your meanings are diverging. Not a crisis — a gap." } };
function DashboardPage(){
  const navigate = useNavigate(); const [pair, setPair] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(()=>{ apiFetch("/pairs/me").then((d)=>setPair(d.pair)).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="cg-full-center"><p className="cg-muted animate-pulse" data-testid="dashboard-loading">Reading your state...</p></div>;
  if (!pair) return <section className="space-y-lg" data-testid="dashboard-page"><div className="cg-full-center gap-8"><div className="text-center"><h2>No active partnership</h2><p className="cg-muted">Start a connection to begin.</p></div><button onClick={()=>navigate('/invite')} className="cg-btn-primary" data-testid="dashboard-invite-button">Invite a Partner</button></div><AiAvatarPanel compact/><HoroscopePanel compact/></section>;
  const config = stateConfig[pair.relational_state] || stateConfig.DORMANT;
  const dims = [{label:'Availability', value:50},{label:'Alignment', value:50},{label:'Activation', value:50},{label:'Trust', value:50}];
  return <section className="space-y-12" data-testid="dashboard-page"><AiAvatarPanel compact/><HoroscopePanel compact/><div className="cg-state-hero" style={{borderColor:config.color}} data-testid="relational-state-card"><p className="cg-label-static">Relational State</p><h1 style={{color:config.color}} data-testid="relational-state-title">{config.label}</h1><p className="cg-muted max-w-2xl" data-testid="relational-state-description">{config.description}</p></div><div className="cg-card" data-testid="signal-dimensions-card"><p className="cg-label-static mb-6">Signal Dimensions</p><div className="grid grid-cols-1 md:grid-cols-2 gap-8">{dims.map((d)=><div key={d.label} data-testid={`signal-${d.label.toLowerCase()}`}><p className="cg-label-static">{d.label}</p><div className="flex items-end gap-4 mb-4"><p className="text-3xl font-serif" style={{color:'#F59E0B'}}>Moderate</p><p className="text-sm text-[#999]">{d.value}/100</p></div><div className="cg-progress"><span style={{width:`${d.value}%`, background:'#F59E0B'}} /></div></div>)}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={()=>navigate('/bently')} className="cg-btn-primary py-4" data-testid="dashboard-bently-button">Talk to Bently</button><button onClick={()=>navigate('/messages')} className="cg-btn-secondary py-4" data-testid="dashboard-messages-button">Messages</button></div></section>;
}

function InvitePage(){
  const navigate = useNavigate(); const [invite, setInvite] = useState(null); const [copied, setCopied] = useState(false);
  useEffect(()=>{ apiFetch('/pairs/invite',{method:'POST'}).then(setInvite); }, []);
  const code = invite?.invite_code;
  const copy=()=>{ if(!code)return; navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return <main className="cg-dark-screen" data-testid="invite-page"><div className="w-full max-w-md"><p className="cg-mono-label mb-2">CommonGround</p><h1 className="cg-dark-title" data-testid="invite-title">Invite Your Partner</h1><p className="cg-dark-muted mb-12">Share this code. When they enter it, your shared space activates.</p>{code?<><button onClick={copy} className="cg-code-card" data-testid="invite-code-button"><p data-testid="invite-code-display">{code}</p><span>{copied?'Copied':'Tap to copy'}</span></button><div className="flex justify-between mb-8"><p className="cg-mono-label">7d window</p><p className="cg-mono-label">Waiting...</p></div><div className="flex gap-3"><button className="cg-btn-primary flex-1" onClick={copy} data-testid="invite-share-button">Share Code</button><button className="cg-btn-dark flex-1" onClick={()=>navigate('/join')} data-testid="invite-join-link">I Have a Code</button></div></>:<div className="cg-dark-box"><p className="cg-mono-label animate-pulse">Generating code...</p></div>}</div></main>;
}
function JoinPage(){
  const navigate=useNavigate(); const [code,setCode]=useState(''); const [error,setError]=useState('');
  const submit=async()=>{ if(code.length!==8){setError('Code must be 8 characters.'); return;} try{ await apiFetch('/pairs/join',{method:'POST',body:JSON.stringify({invite_code:code})}); navigate('/dashboard'); }catch(e){setError(e.message);} };
  return <main className="cg-dark-screen" data-testid="join-page"><div className="w-full max-w-md"><p className="cg-mono-label mb-2">CommonGround</p><h1 className="cg-dark-title" data-testid="join-title">Enter Code</h1><p className="cg-dark-muted mb-12">Your partner generated a code. Enter it here to connect.</p><input value={code} onChange={(e)=>{setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)); setError('');}} maxLength={8} className="cg-code-input" placeholder="A1B2C3D4" data-testid="join-code-input" />{error&&<p className="cg-error mt-4" data-testid="join-error-message">{error}</p>}<div className="flex gap-3 mt-6"><button onClick={submit} className="cg-btn-primary flex-1" disabled={code.length!==8} data-testid="join-submit-button">Connect</button><button onClick={()=>navigate('/invite')} className="cg-btn-dark flex-1" data-testid="join-generate-button">Generate Code</button></div></div></main>;
}

function MessagesPage(){
  const { user }=useAuth(); const [items,setItems]=useState([]); const [pair,setPair]=useState(null); const [input,setInput]=useState('');
  const load=useCallback(()=>apiFetch('/messages').then((d)=>{setItems(d.items||[]); setPair(d.pair||null);}),[]); useEffect(()=>{load();},[load]);
  const send=async()=>{const content=input.trim(); if(!content||!pair)return; setInput(''); const msg=await apiFetch('/messages',{method:'POST',body:JSON.stringify({content})}); setItems([...items,msg]);};
  if(!pair) return <div className="cg-full-center" data-testid="messages-page"><p className="cg-mono-label">No active pair</p></div>;
  return <section className="cg-thread" data-testid="messages-page"><div className="mb-6"><p className="cg-mono-label mb-1">Messages</p><h1 className="cg-thread-title">Thread</h1></div><div className="cg-message-list" data-testid="messages-thread-panel">{items.length===0&&<p className="cg-mono-label text-center">No messages yet</p>}{items.map((m)=><div key={m.message_id} className={`flex ${m.user_id===user?.user_id?'justify-end':'justify-start'}`} data-testid={`direct-message-${m.message_id}`}><div className={`cg-message ${m.user_id===user?.user_id?'self':'other'}`}>{m.content}<p>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p></div></div>)}</div><div className="cg-compose"><textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Type a message..." data-testid="messages-textarea" /><div><p>↵ to send</p><button onClick={send} disabled={!input.trim()} data-testid="messages-send-button">Send</button></div></div></section>;
}

const STATE_COLORS={DORMANT:'#6B7280',ALIGNED:'#10B981',MISALIGNED:'#F59E0B',CAPACITY_BLOCKED:'#9D4EDD',TRUST_FRACTURED:'#E63946'};
function BentlyPage(){
  const [input,setInput]=useState(''); const [entries,setEntries]=useState([]); const [thinking,setThinking]=useState(false);
  const submit=async()=>{const message=input.trim(); if(!message||thinking)return; setInput(''); setThinking(true); try{const data=await apiFetch('/bently',{method:'POST',body:JSON.stringify({message,mode:'solo'})}); setEntries([...entries,{id:data.entry_id,userMessage:message,response:data.response,state:'DORMANT',xpEarned:data.xp_earned||0,timestamp:new Date()}]);}finally{setThinking(false);}};
  return <section className="cg-thread" data-testid="bently-page"><div className="flex justify-between mb-8"><div><p className="cg-mono-label mb-1">Bently</p><h1 className="cg-thread-title">What's happening?</h1></div><div className="text-right"><p className="cg-mono-label mb-1">Reading this as</p><p className="cg-mono-label" style={{color:STATE_COLORS.DORMANT}}>Dormant</p></div></div><AiAvatarPanel compact/><div className="cg-bently-list" data-testid="bently-chat-panel">{entries.length===0&&!thinking&&<div className="cg-full-center h-32"><p className="cg-mono-label">Write something. Bently is reading the state.</p></div>}{entries.map((e)=><div key={e.id} className="space-y-4" data-testid={`bently-entry-${e.id}`}><div className="flex justify-end"><p className="cg-user-reflection">{e.userMessage}</p></div><div className="cg-bently-response"><p data-testid={`bently-response-${e.id}`}>{e.response}</p><div className="flex gap-4 mt-3"><span>+{e.xpEarned} xp</span><span style={{color:STATE_COLORS[e.state]}}>Dormant</span><span>{e.timestamp.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div></div></div>)}{thinking&&<div className="cg-bently-response"><p data-testid="bently-thinking-message">██░</p></div>}</div><div className="cg-compose"><textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}}} placeholder="Say what's actually happening..." data-testid="bently-textarea" /><div><p>↵ to send · shift+↵ for newline</p><button onClick={submit} disabled={!input.trim()||thinking} data-testid="bently-send-button">Send</button></div></div></section>;
}

function XpPage(){
  const [xp,setXp]=useState(null); useEffect(()=>{apiFetch('/xp').then(setXp);},[]); if(!xp) return <LoadingScreen/>;
  const current=xp.current_rank; const next=xp.next_rank; const pct=next?Math.min(100,Math.round((xp.current_xp-current.xp)/(next.xp-current.xp)*100)):100;
  return <section className="space-y-lg" data-testid="xp-page"><div className="mb-lg"><h2>XP & Rank</h2><p className="cg-muted">Track your relational growth and progression.</p></div><div className="cg-card border-2 border-[#D4AF37]"><div className="flex justify-between mb-lg"><div><h3>Level {current.level}</h3><p className="text-3xl font-bold text-[#D4AF37]" data-testid="xp-rank-name">{current.rank}</p><p className="cg-muted">High mastery in relational communication</p></div><div className="text-6xl">✧</div></div><div className="flex justify-between"><span>Progress to {next?.rank||'top rank'}</span><span data-testid="xp-current-value">{xp.current_xp} / {next?.xp||xp.current_xp} XP</span></div><div className="cg-progress mt-2"><span style={{width:`${pct}%`,background:'#D4AF37'}} /></div></div><div className="cg-card"><h3>Rank Progression</h3>{xp.rank_ladder.map((r)=><div className="cg-row" key={r.rank} data-testid={`rank-row-${r.rank.toLowerCase()}`}><span>Level {r.level}: {r.rank}</span><strong>{r.xp} XP</strong></div>)}</div><div className="cg-card"><h3>Recent XP Gains</h3>{xp.events.length===0&&<p className="cg-muted">No XP gains yet.</p>}{xp.events.map((e)=><div className="cg-row" key={e.event_id}><span>{e.source}</span><strong>+{e.amount}</strong></div>)}</div></section>;
}
function MissionsPage(){
  const [missions,setMissions]=useState([]); const load=useCallback(()=>apiFetch('/missions').then(d=>setMissions(d.items||[])),[]); useEffect(()=>{load();},[load]); const toggle=async(id)=>{await apiFetch(`/missions/${id}/toggle`,{method:'POST'}); load();};
  return <section data-testid="missions-page"><div className="mb-lg"><h2>Missions</h2><p className="cg-muted">Complete missions to strengthen your relational bond and earn XP.</p></div><HoroscopePanel compact/><div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg"><div className="cg-card"><h4>Total Missions</h4><p className="cg-stat">{missions.length}</p></div><div className="cg-card"><h4>Completed</h4><p className="cg-stat">{missions.filter(m=>m.completed).length}</p></div><div className="cg-card"><h4>XP Pending</h4><p className="cg-stat">{missions.filter(m=>!m.completed).reduce((s,m)=>s+m.xp_reward,0)}</p></div></div><div className="space-y-md">{missions.map((m)=><div key={m.mission_id} className={`cg-card ${m.completed?'opacity-60':''}`} data-testid={`mission-card-${m.mission_id}`}><div className="flex gap-lg"><input type="checkbox" checked={m.completed} onChange={()=>toggle(m.mission_id)} data-testid={`mission-toggle-${m.mission_id}`} /><div className="flex-1"><div className="flex justify-between"><div><h3 className={m.completed?'line-through':''}>{m.title}</h3><p className="cg-muted">{m.description}</p></div><p className="text-lg font-bold text-[#D4AF37]">+{m.xp_reward} XP</p></div><span className="cg-badge">{m.difficulty}</span></div></div></div>)}</div></section>;
}
function JournalPage(){
  const [entries,setEntries]=useState([]); const [show,setShow]=useState(false); const [entry,setEntry]=useState(''); const load=useCallback(()=>apiFetch('/journal').then(d=>setEntries(d.items||[])),[]); useEffect(()=>{load();},[load]); const add=async()=>{if(!entry.trim())return; await apiFetch('/journal',{method:'POST',body:JSON.stringify({title:'Reflection',content:entry,sentiment:'neutral'})}); setEntry('');setShow(false);load();};
  return <section data-testid="journal-page"><div className="mb-lg flex justify-between"><div><h2>Journal</h2><p className="cg-muted">Private reflections on your relationship.</p></div><button className="cg-btn-primary" onClick={()=>setShow(!show)} data-testid="journal-new-button">{show?'Cancel':'New Entry'}</button></div><HoroscopePanel compact/>{show&&<div className="cg-card mb-lg"><textarea className="cg-textarea" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="What's on your mind? Reflect freely..." data-testid="journal-content-input"/><div className="flex gap-md mt-lg"><button className="cg-btn-primary" onClick={add} data-testid="journal-save-button">Save Entry</button><button className="cg-btn-secondary" onClick={()=>setShow(false)} data-testid="journal-cancel-button">Cancel</button></div></div>}<div className="space-y-lg">{entries.map(e=><div className="cg-card" key={e.entry_id} data-testid={`journal-entry-${e.entry_id}`}><div className="flex justify-between mb-md"><div><h3>{e.title}</h3><p className="text-xs text-[#999]">{new Date(e.created_at).toLocaleDateString()}</p></div><span className="text-[#D4AF37]">{e.sentiment}</span></div><p>{e.content}</p></div>)}</div></section>;
}
function DeeplyUsPage(){
  const [data,setData]=useState({items:[],categories:[]}); const [form,setForm]=useState({title:'',category:'Memory',note:''}); const load=useCallback(()=>apiFetch('/vault').then(setData),[]); useEffect(()=>{load();},[load]); const add=async()=>{if(!form.title.trim())return; await apiFetch('/vault',{method:'POST',body:JSON.stringify(form)}); setForm({title:'',category:'Memory',note:''}); load();};
  return <section data-testid="vault-page"><div className="mb-lg"><h2>DeeplyUs Vault</h2><p className="cg-muted">Shared memories, milestones, and moments that matter.</p></div><AiAvatarPanel compact/><div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">{data.categories.map(c=><div className="cg-card" key={c.title} data-testid={`vault-category-${c.title.toLowerCase()}`}><div className="flex justify-between"><div><h3>{c.title}</h3><p className="cg-muted">Photos, moments, and shared meaning</p></div><span className="text-3xl">◇</span></div><p className="text-lg font-bold text-[#D4AF37]">{c.count} items</p></div>)}</div><div className="cg-card mb-lg text-center"><h3>Add to Vault</h3><input className="cg-input my-2" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title" data-testid="vault-title-input"/><input className="cg-input my-2" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Category" data-testid="vault-category-input"/><textarea className="cg-textarea my-2" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Why it matters" data-testid="vault-note-input"/><button className="cg-btn-primary" onClick={add} data-testid="vault-add-button">Choose File</button></div><div className="space-y-md">{data.items.map(i=><div className="cg-card" key={i.item_id} data-testid={`vault-item-${i.item_id}`}><p className="font-medium">{i.title}</p><p className="cg-muted">{i.category}</p><p>{i.note}</p></div>)}</div></section>;
}
function CalendarPage(){
  const [events,setEvents]=useState([]); const [form,setForm]=useState({title:'',date:new Date().toISOString().slice(0,10),description:'',event_type:'checkin'}); const load=useCallback(()=>apiFetch('/calendar').then(d=>setEvents(d.items||[])),[]); useEffect(()=>{load();},[load]); const add=async()=>{if(!form.title.trim())return; await apiFetch('/calendar',{method:'POST',body:JSON.stringify(form)}); setForm({...form,title:'',description:''});load();};
  return <section data-testid="calendar-page"><div className="mb-lg flex justify-between"><div><h2>Calendar</h2><p className="cg-muted">Shared events and important dates.</p></div><button className="cg-btn-primary" onClick={add} data-testid="calendar-add-button">Add Event</button></div><div className="cg-card mb-lg"><div className="grid grid-cols-1 md:grid-cols-3 gap-md"><input className="cg-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Event title" data-testid="calendar-title-input"/><input type="date" className="cg-input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} data-testid="calendar-date-input"/><input className="cg-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description" data-testid="calendar-description-input"/></div></div><div className="space-y-md">{events.map(e=><div className="cg-card" key={e.event_id} data-testid={`calendar-event-${e.event_id}`}><div className="flex justify-between"><div><p className="font-medium">{e.title}</p><p className="cg-muted">{e.description}</p></div><span className="cg-badge">{e.date}</span></div></div>)}</div></section>;
}
function SettingsPage(){
  const { user }=useAuth(); const [settings,setSettings]=useState(null); const [saved,setSaved]=useState(false); useEffect(()=>{apiFetch('/settings').then(setSettings);},[]); if(!settings)return<LoadingScreen/>; const save=async()=>{setSettings(await apiFetch('/settings',{method:'PATCH',body:JSON.stringify(settings)})); setSaved(true);};
  return <section className="max-w-2xl" data-testid="settings-page"><div className="mb-lg"><h2>Settings</h2><p className="cg-muted">Manage your CommonGround preferences.</p></div><AiAvatarPanel interactive/><div className="cg-card mb-lg"><h3>Account</h3><label className="cg-label">Email Address<input className="cg-input opacity-50" value={user.email} disabled data-testid="settings-email"/></label><button className="cg-btn-secondary w-full mt-lg" data-testid="settings-change-password-button">Change Password</button></div><div className="cg-card mb-lg"><h3>Notifications</h3><label className="cg-row">Push Notifications<input type="checkbox" checked={settings.notifications_enabled} onChange={()=>setSettings({...settings,notifications_enabled:!settings.notifications_enabled})} data-testid="settings-notifications-toggle"/></label><label className="cg-row">Email Digest<input type="checkbox" checked={settings.email_digest} onChange={()=>setSettings({...settings,email_digest:!settings.email_digest})} data-testid="settings-email-toggle"/></label></div><div className="cg-card mb-lg"><h3>Preferences</h3><label className="cg-label">Language<input className="cg-input" value={settings.language} onChange={e=>setSettings({...settings,language:e.target.value})} data-testid="settings-language-input"/></label></div><div className="cg-card border-2 border-[#E63946]/30"><h3 className="text-[#E63946]">Danger Zone</h3><button className="cg-btn-secondary w-full text-[#E63946]" data-testid="settings-disconnect-button">Disconnect from Partner</button><button className="cg-btn-secondary w-full text-[#E63946] mt-md" data-testid="settings-delete-button">Delete Account</button></div><div className="flex gap-md pt-lg"><button className="cg-btn-primary flex-1" onClick={save} data-testid="settings-save-button">Save Changes</button><button className="cg-btn-secondary flex-1" data-testid="settings-cancel-button">Cancel</button></div>{saved&&<p className="text-[#D4AF37] mt-md" data-testid="settings-saved-message">Saved</p>}</section>;
}

function AppRoutes(){
  const location=useLocation(); if(location.hash?.includes('session_id=')) return <AuthCallback/>;
  return <Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route path="/invite" element={<ProtectedRoute><InvitePage/></ProtectedRoute>}/><Route path="/join" element={<ProtectedRoute><JoinPage/></ProtectedRoute>}/><Route element={<ProtectedRoute><Layout/></ProtectedRoute>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/messages" element={<MessagesPage/>}/><Route path="/bently" element={<BentlyPage/>}/><Route path="/xp" element={<XpPage/>}/><Route path="/missions" element={<MissionsPage/>}/><Route path="/journal" element={<JournalPage/>}/><Route path="/deeplyus" element={<DeeplyUsPage/>}/><Route path="/calendar" element={<CalendarPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/" element={<Navigate to="/dashboard" replace/>}/></Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes>;
}
function App(){ return <BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter>; }
export default App;
