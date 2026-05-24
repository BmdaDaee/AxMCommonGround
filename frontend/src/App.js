import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Archive,
  BarChart3,
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Home,
  Link2,
  LogOut,
  MessageCircle,
  MessageSquare,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Settings,
  Target,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const heroImage = "https://static.prod-images.emergentagent.com/jobs/e973329e-3eeb-4b62-b491-0f73f54e7018/images/de8816e0e05fcfcdf13d26cfadd7ea72ba3ec443f9b330aff603611508f79c6e.png";
const authImage = "https://static.prod-images.emergentagent.com/jobs/e973329e-3eeb-4b62-b491-0f73f54e7018/images/a6c3eca8a6dcf4e888d74c58ffc4aafc92bae3e1d56a9c5d19db3416a6a581c2.png";

const AuthContext = createContext(null);

const getStoredToken = () => localStorage.getItem("cg_session_token");

async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || "Something went wrong");
  }
  return payload;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return null;
    }
    if (!getStoredToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const profile = await apiFetch("/auth/me");
      setUser(profile);
      return profile;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn(error.message);
    } finally {
      localStorage.removeItem("cg_session_token");
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, refreshUser, logout }), [user, loading, refreshUser, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#F9F9F6]" data-testid="loading-screen">
      <div className="flex items-center gap-3 text-[#163832]" data-testid="loading-message">
        <Sparkles className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-bold tracking-[0.2em] uppercase">Opening CommonGround</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }
    apiFetch("/auth/google/session", { method: "POST", body: JSON.stringify({ session_id: sessionId }) })
      .then((data) => {
        if (data?.session_token) localStorage.setItem("cg_session_token", data.session_token);
        setUser(data.user);
        navigate("/dashboard", { replace: true, state: { user: data.user } });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, setUser]);

  return <LoadingScreen />;
}

function GoogleButton({ label = "Continue with Google" }) {
  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <Button type="button" variant="outline" onClick={handleGoogle} className="h-12 w-full rounded-sm border-[#DAD8CF] bg-white text-[#163832] hover:bg-[#F0EFEA] hover:text-[#163832]" data-testid="google-login-button">
      <ShieldCheck className="h-4 w-4" /> {label}
    </Button>
  );
}

function LandingPage() {
  const { user } = useAuth();
  const features = [
    { icon: Users, title: "Profile-based matching", copy: "Find people who share values, goals, and communication style." },
    { icon: MessageSquare, title: "Discussion circles", copy: "Post questions, invite comments, and practice better repair." },
    { icon: BarChart3, title: "Admin clarity", copy: "Track participation and health signals from one clean dashboard." },
  ];
  return (
    <main className="landing-shell" data-testid="landing-page">
      <nav className="top-nav" data-testid="landing-nav">
        <Link to="/" className="brand-mark" data-testid="landing-brand-link"><HeartHandshake className="h-5 w-5" /> CommonGround</Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#4A5A55]" data-testid="landing-nav-links">
          <a href="#features" data-testid="features-anchor-link">Features</a>
          <a href="#method" data-testid="method-anchor-link">Method</a>
          <a href="#community" data-testid="community-anchor-link">Community</a>
        </div>
        <Button asChild className="rounded-sm bg-[#163832] px-6 text-white hover:bg-[#215249] hover:text-white" data-testid="landing-start-button">
          <Link to={user ? "/dashboard" : "/signup"}>{user ? "Open app" : "Start free"}</Link>
        </Button>
      </nav>

      <section className="hero-grid" data-testid="hero-section">
        <div className="hero-copy" data-testid="hero-copy">
          <Badge className="w-fit rounded-sm bg-[#E9E5D8] px-4 py-2 text-[#163832] hover:bg-[#E9E5D8]" data-testid="hero-eyebrow">Communication help for shared decisions</Badge>
          <h1 data-testid="hero-title">Find the ground people can actually stand on together.</h1>
          <p data-testid="hero-subtitle">AxM CommonGround turns profiles, posts, and guided prompts into a calmer place for groups, couples, and communities to name values before conflict takes over.</p>
          <div className="flex flex-col sm:flex-row gap-4" data-testid="hero-actions">
            <Button asChild className="h-12 rounded-sm bg-[#CC5A47] px-7 text-white hover:bg-[#DF6C59] hover:text-white" data-testid="hero-primary-cta">
              <Link to={user ? "/dashboard" : "/signup"}>Create your space <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-sm border-[#163832] px-7 text-[#163832] hover:bg-[#163832] hover:text-white" data-testid="hero-secondary-cta">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="hero-visual" data-testid="hero-visual-card">
          <img src={heroImage} alt="Abstract common ground illustration" data-testid="hero-image" />
          <div className="hero-stat" data-testid="hero-stat-card">
            <span data-testid="hero-stat-value">88%</span>
            <p data-testid="hero-stat-label">Common-ground clarity after values are named first</p>
          </div>
        </div>
      </section>

      <section id="features" className="feature-grid" data-testid="features-section">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="feature-card" data-testid={`feature-card-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>
              <CardHeader>
                <Icon className="h-6 w-6 text-[#CC5A47]" />
                <CardTitle className="text-2xl text-[#0F1E1A]" data-testid={`feature-title-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-[#4A5A55]" data-testid={`feature-copy-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>{feature.copy}</p></CardContent>
            </Card>
          );
        })}
      </section>

      <section id="method" className="method-panel" data-testid="method-section">
        <div>
          <p className="section-label" data-testid="method-label">The method</p>
          <h2 data-testid="method-title">Before agreement, build shared language.</h2>
        </div>
        <div className="method-steps" data-testid="method-steps">
          {['Create a profile around values', 'Match on common ground', 'Discuss with repair prompts'].map((step, index) => (
            <div className="method-step" key={step} data-testid={`method-step-${index + 1}`}>
              <span data-testid={`method-step-number-${index + 1}`}>0{index + 1}</span>
              <p data-testid={`method-step-text-${index + 1}`}>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = isSignup ? form : { email: form.email, password: form.password };
      const data = await apiFetch(isSignup ? "/auth/signup" : "/auth/login", { method: "POST", body: JSON.stringify(payload) });
      if (data?.session_token) localStorage.setItem("cg_session_token", data.session_token);
      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell" data-testid={`${mode}-page`}>
      <section className="auth-art" data-testid="auth-art-section">
        <img src={authImage} alt="CommonGround textured background" data-testid="auth-background-image" />
        <div className="auth-art-copy" data-testid="auth-art-copy">
          <HeartHandshake className="h-8 w-8" />
          <h1 data-testid="auth-art-title">A calmer room for difficult things.</h1>
          <p data-testid="auth-art-text">Bring values, context, and care into the conversation before deciding what comes next.</p>
        </div>
      </section>
      <section className="auth-form-panel" data-testid="auth-form-panel">
        <Link to="/" className="brand-mark mb-10" data-testid="auth-home-link"><HeartHandshake className="h-5 w-5" /> CommonGround</Link>
        <div className="w-full max-w-md" data-testid="auth-form-card">
          <p className="section-label" data-testid="auth-mode-label">{isSignup ? "Create account" : "Welcome back"}</p>
          <h2 className="mb-3 text-4xl font-black tracking-tight text-[#0F1E1A]" data-testid="auth-heading">{isSignup ? "Build your profile" : "Sign in to your space"}</h2>
          <p className="mb-8 text-[#4A5A55]" data-testid="auth-description">{isSignup ? "Start with your name, then add values and goals inside the app." : "Use your password or Google to continue."}</p>
          <GoogleButton label={isSignup ? "Sign up with Google" : "Continue with Google"} />
          <div className="my-6 flex items-center gap-4" data-testid="auth-divider"><span className="h-px flex-1 bg-[#E2E1D9]" /><span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A958F]">or</span><span className="h-px flex-1 bg-[#E2E1D9]" /></div>
          <form onSubmit={submit} className="space-y-5" data-testid={`${mode}-form`}>
            {isSignup && (
              <label className="field-label" data-testid="signup-name-label">Name
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field-input" required data-testid="signup-name-input" />
              </label>
            )}
            <label className="field-label" data-testid={`${mode}-email-label`}>Email
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field-input" required data-testid={`${mode}-email-input`} />
            </label>
            <label className="field-label" data-testid={`${mode}-password-label`}>Password
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field-input" required minLength={isSignup ? 8 : undefined} data-testid={`${mode}-password-input`} />
            </label>
            {error && <p className="error-banner" data-testid={`${mode}-error-message`}>{error}</p>}
            <Button disabled={busy} className="h-12 w-full rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid={`${mode}-submit-button`}>{busy ? "Working..." : isSignup ? "Create account" : "Sign in"}</Button>
          </form>
          <p className="mt-7 text-sm text-[#4A5A55]" data-testid="auth-switch-text">
            {isSignup ? "Already have an account?" : "New to CommonGround?"}{" "}
            <Link className="font-bold text-[#CC5A47]" to={isSignup ? "/login" : "/signup"} data-testid="auth-switch-link">{isSignup ? "Sign in" : "Create one"}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/pair", label: "Pair", icon: Link2 },
  { to: "/matching", label: "Matching", icon: Users },
  { to: "/discussions", label: "Discussions", icon: MessageSquare },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/bently", label: "Bently", icon: Bot },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/vault", label: "DeeplyUs", icon: Archive },
  { to: "/xp", label: "XP", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/admin", label: "Admin", icon: PanelsTopLeft, admin: true },
];

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => !item.admin || user?.role === "admin");
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <div className="app-shell" data-testid="app-shell">
      <aside className="sidebar" data-testid="sidebar-navigation">
        <Link to="/dashboard" className="brand-mark" data-testid="dashboard-brand-link"><HeartHandshake className="h-5 w-5" /> CommonGround</Link>
        <nav className="sidebar-nav" data-testid="main-navigation-links">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} data-testid={`nav-link-${item.label.toLowerCase()}`}>
                <Icon className="h-4 w-4" /> {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-user" data-testid="sidebar-user-card">
          <div className="avatar" data-testid="sidebar-user-avatar">{user?.picture ? <img src={user.picture} alt={user.name} /> : user?.name?.[0]}</div>
          <div className="min-w-0">
            <p className="truncate font-bold text-[#0F1E1A]" data-testid="sidebar-user-name">{user?.name}</p>
            <p className="truncate text-xs text-[#60706A]" data-testid="sidebar-user-role">{user?.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto hover:bg-[#F4E2DC] hover:text-[#CC5A47]" data-testid="logout-button"><LogOut className="h-4 w-4" /></Button>
        </div>
      </aside>
      <main className="workspace" data-testid="workspace-content">{children}</main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header" data-testid={`${title.toLowerCase().replaceAll(" ", "-")}-header`}>
      <div>
        <p className="section-label" data-testid="page-header-eyebrow">{eyebrow}</p>
        <h1 data-testid="page-header-title">{title}</h1>
        <p data-testid="page-header-description">{description}</p>
      </div>
      {action}
    </header>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/matches"), apiFetch("/discussions")])
      .then(([matchData, postData]) => {
        setMatches(matchData.items || []);
        setPosts(postData.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const profileScore = Math.min(100, 25 + (user?.values?.length || 0) * 15 + (user?.interests?.length || 0) * 10 + (user?.goals?.length || 0) * 10);
  const topMatch = matches[0];
  return (
    <AppShell>
      <section data-testid="dashboard-page">
        <PageHeader eyebrow="Control room" title={`Welcome, ${user?.name?.split(" ")[0] || "there"}`} description="See your profile strength, strongest common-ground match, and the newest conversation threads." />
        <div className="dashboard-grid" data-testid="dashboard-grid">
          <Card className="metric-card primary" data-testid="profile-strength-card">
            <CardHeader><CardTitle data-testid="profile-strength-title">Profile strength</CardTitle></CardHeader>
            <CardContent><span className="metric-number" data-testid="profile-strength-value">{profileScore}%</span><p data-testid="profile-strength-copy">Add values, interests, and goals to improve match quality.</p></CardContent>
          </Card>
          <Card className="metric-card" data-testid="top-match-card">
            <CardHeader><CardTitle data-testid="top-match-title">Top match</CardTitle></CardHeader>
            <CardContent>{loading ? <p data-testid="top-match-loading">Finding matches...</p> : <><span className="metric-number" data-testid="top-match-score">{topMatch?.score || 0}%</span><p data-testid="top-match-name">{topMatch?.name || "Complete profile to unlock"}</p></>}</CardContent>
          </Card>
          <Card className="metric-card" data-testid="discussion-count-card">
            <CardHeader><CardTitle data-testid="discussion-count-title">Discussion threads</CardTitle></CardHeader>
            <CardContent><span className="metric-number" data-testid="discussion-count-value">{posts.length}</span><p data-testid="discussion-count-copy">Live prompts and community questions.</p></CardContent>
          </Card>
        </div>
        <div className="two-column" data-testid="dashboard-detail-grid">
          <Card className="panel-card" data-testid="common-ground-panel">
            <CardHeader><CardTitle className="flex items-center gap-2" data-testid="common-ground-title"><HeartHandshake className="h-5 w-5 text-[#CC5A47]" /> Common-ground brief</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {(topMatch?.shared_values?.length ? topMatch.shared_values : ["trust", "clarity", "repair"]).map((value) => <Badge key={value} className="mr-2 rounded-sm bg-[#F4E2DC] text-[#9F402F] hover:bg-[#F4E2DC]" data-testid={`shared-value-${value}`}>{value}</Badge>)}
              <p className="text-[#4A5A55]" data-testid="common-ground-copy">Open with a shared value before asking for agreement. It keeps the conversation anchored in purpose instead of position.</p>
              <Button asChild className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="common-ground-action"><Link to="/matching">Review matches</Link></Button>
            </CardContent>
          </Card>
          <Card className="panel-card" data-testid="latest-discussion-panel">
            <CardHeader><CardTitle data-testid="latest-discussion-title">Latest discussion</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-2xl font-black text-[#0F1E1A]" data-testid="latest-discussion-heading">{posts[0]?.title || "No posts yet"}</h3>
              <p className="text-[#4A5A55]" data-testid="latest-discussion-body">{posts[0]?.body || "Start the first conversation in your community."}</p>
              <Button asChild variant="outline" className="rounded-sm border-[#163832] text-[#163832] hover:bg-[#163832] hover:text-white" data-testid="latest-discussion-action"><Link to="/discussions">Open discussions</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", location: user?.location || "", communication_style: user?.communication_style || "Reflective", values: (user?.values || []).join(", "), interests: (user?.interests || []).join(", "), goals: (user?.goals || []).join(", ") });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const toList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    const updated = await apiFetch("/profile", { method: "PATCH", body: JSON.stringify({ ...form, values: toList(form.values), interests: toList(form.interests), goals: toList(form.goals) }) });
    setUser(updated);
    setSaved(true);
    setBusy(false);
  };
  return (
    <AppShell>
      <section data-testid="profile-page">
        <PageHeader eyebrow="Identity" title="Profile & signals" description="Tell CommonGround what you value, how you communicate, and what kind of repair you want to practice." />
        <form onSubmit={submit} className="profile-form" data-testid="profile-form">
          <label className="field-label" data-testid="profile-name-label">Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field-input" data-testid="profile-name-input" /></label>
          <label className="field-label" data-testid="profile-location-label">Location<Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="field-input" data-testid="profile-location-input" /></label>
          <label className="field-label md:col-span-2" data-testid="profile-bio-label">Bio<Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="field-input min-h-28" data-testid="profile-bio-input" /></label>
          <label className="field-label" data-testid="profile-style-label">Communication style<Input value={form.communication_style} onChange={(e) => setForm({ ...form, communication_style: e.target.value })} className="field-input" data-testid="profile-style-input" /></label>
          <label className="field-label" data-testid="profile-values-label">Values<Input value={form.values} onChange={(e) => setForm({ ...form, values: e.target.value })} placeholder="trust, clarity, family" className="field-input" data-testid="profile-values-input" /></label>
          <label className="field-label" data-testid="profile-interests-label">Interests<Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="dialogue, mutual aid" className="field-input" data-testid="profile-interests-input" /></label>
          <label className="field-label" data-testid="profile-goals-label">Goals<Input value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="practice repair, align decisions" className="field-input" data-testid="profile-goals-input" /></label>
          <div className="md:col-span-2 flex items-center gap-4" data-testid="profile-actions"><Button disabled={busy} className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="profile-save-button">{busy ? "Saving..." : "Save profile"}</Button>{saved && <p className="text-sm font-bold text-[#2D6A4F]" data-testid="profile-saved-message">Profile updated</p>}</div>
        </form>
      </section>
    </AppShell>
  );
}

function MatchingPage() {
  const [matches, setMatches] = useState([]);
  const [starter, setStarter] = useState(null);
  useEffect(() => { apiFetch("/matches").then((data) => setMatches(data.items || [])); }, []);
  return (
    <AppShell>
      <section data-testid="matching-page">
        <PageHeader eyebrow="People" title="Common-ground matching" description="Review people whose values and interests overlap with yours, then open with a grounded prompt." />
        <div className="match-grid" data-testid="match-grid">
          {matches.map((match) => (
            <Card key={match.user_id} className="match-card" data-testid={`match-card-${match.user_id}`}>
              <CardContent className="p-0">
                <div className="match-photo" data-testid={`match-photo-${match.user_id}`}>{match.picture ? <img src={match.picture} alt={match.name} loading="eager" /> : match.name?.[0]}</div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4"><div><h3 data-testid={`match-name-${match.user_id}`}>{match.name}</h3><p data-testid={`match-style-${match.user_id}`}>{match.communication_style} communicator</p></div><span className="score-pill" data-testid={`match-score-${match.user_id}`}>{match.score}%</span></div>
                  <p className="text-sm text-[#4A5A55]" data-testid={`match-bio-${match.user_id}`}>{match.bio}</p>
                  <div data-testid={`match-shared-values-${match.user_id}`}>{(match.shared_values?.length ? match.shared_values : match.values?.slice(0, 3) || []).map((value) => <Badge key={value} className="mr-2 mt-2 rounded-sm bg-[#E9E5D8] text-[#163832] hover:bg-[#E9E5D8]">{value}</Badge>)}</div>
                  <Button onClick={() => setStarter(match)} className="w-full rounded-sm bg-[#CC5A47] text-white hover:bg-[#DF6C59] hover:text-white" data-testid={`match-starter-button-${match.user_id}`}>Generate opener</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {starter && <div className="starter-panel" data-testid="conversation-starter-panel"><Button variant="ghost" onClick={() => setStarter(null)} className="float-right" data-testid="starter-close-button">Close</Button><p className="section-label" data-testid="starter-label">Conversation starter</p><h3 data-testid="starter-title">Open with {starter.name}</h3><p data-testid="starter-text">“I noticed we both care about {(starter.shared_values?.[0] || starter.values?.[0] || "trust")}. What does that value look like when a conversation gets hard?”</p></div>}
      </section>
    </AppShell>
  );
}

function PairPage() {
  const [pairData, setPairData] = useState(null);
  const [invite, setInvite] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const loadPair = useCallback(() => apiFetch("/pairs/me").then(setPairData), []);
  useEffect(() => { loadPair(); }, [loadPair]);
  const createInvite = async () => {
    setError("");
    setInvite(await apiFetch("/pairs/invite", { method: "POST" }));
  };
  const joinPair = async () => {
    try {
      setError("");
      await apiFetch("/pairs/join", { method: "POST", body: JSON.stringify({ invite_code: code }) });
      setCode("");
      loadPair();
    } catch (err) { setError(err.message); }
  };
  return (
    <AppShell>
      <section data-testid="pair-page">
        <PageHeader eyebrow="Pair formation" title="Invite or join a partner" description="The original repo pairs two people into a shared CommonGround space with invite codes and direct messaging." />
        <div className="two-column" data-testid="pair-grid">
          <Card className="panel-card" data-testid="pair-status-card"><CardHeader><CardTitle>Current pair</CardTitle></CardHeader><CardContent>{pairData?.pair ? <div className="space-y-3"><Badge className="rounded-sm bg-[#163832] text-white" data-testid="pair-status-badge">{pairData.pair.status}</Badge><p data-testid="pair-partner-name">Partner: {pairData.partner?.name || "Connected member"}</p><p data-testid="pair-state">State: {pairData.pair.relational_state}</p></div> : <p className="text-[#4A5A55]" data-testid="pair-empty-message">No active pair yet. Create an invite or enter a partner code.</p>}</CardContent></Card>
          <Card className="panel-card" data-testid="pair-invite-card"><CardHeader><CardTitle>Create invite</CardTitle></CardHeader><CardContent className="space-y-4"><Button onClick={createInvite} className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="create-invite-button">Generate invite code</Button>{invite && <div className="invite-code" data-testid="invite-code-display">{invite.invite_code}</div>}<div className="flex gap-3"><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" className="field-input" data-testid="join-code-input" /><Button onClick={joinPair} className="rounded-sm bg-[#CC5A47] text-white hover:bg-[#DF6C59] hover:text-white" data-testid="join-pair-button">Join</Button></div>{error && <p className="error-banner" data-testid="pair-error-message">{error}</p>}</CardContent></Card>
        </div>
      </section>
    </AppShell>
  );
}

function DiscussionsPage() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [form, setForm] = useState({ title: "", body: "", tag: "repair" });
  const loadPosts = useCallback(() => apiFetch("/discussions").then((data) => setPosts(data.items || [])), []);
  useEffect(() => { loadPosts(); }, [loadPosts]);
  const createPost = async (event) => {
    event.preventDefault();
    const post = await apiFetch("/discussions", { method: "POST", body: JSON.stringify(form) });
    setPosts([post, ...posts]);
    setForm({ title: "", body: "", tag: "repair" });
  };
  const toggleComments = async (postId) => {
    if (comments[postId]) { setComments({ ...comments, [postId]: null }); return; }
    const data = await apiFetch(`/discussions/${postId}/comments`);
    setComments({ ...comments, [postId]: data.items || [] });
  };
  const addComment = async (postId) => {
    const body = (commentInput[postId] || "").trim();
    if (!body) return;
    const comment = await apiFetch(`/discussions/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) });
    setComments({ ...comments, [postId]: [...(comments[postId] || []), comment] });
    setCommentInput({ ...commentInput, [postId]: "" });
  };
  return (
    <AppShell>
      <section data-testid="discussions-page">
        <PageHeader eyebrow="Community" title="Discussions & comments" description="Ask better questions, invite thoughtful responses, and keep a record of what your group is learning." />
        <form onSubmit={createPost} className="discussion-form" data-testid="discussion-create-form">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Question or topic" className="field-input" required data-testid="discussion-title-input" />
          <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="tag" className="field-input" data-testid="discussion-tag-input" />
          <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What context would help people respond well?" className="field-input md:col-span-2 min-h-28" required data-testid="discussion-body-input" />
          <Button className="w-fit rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="discussion-submit-button">Post discussion</Button>
        </form>
        <div className="post-list" data-testid="discussion-post-list">
          {posts.map((post) => (
            <Card key={post.post_id} className="post-card" data-testid={`discussion-post-${post.post_id}`}>
              <CardHeader><div className="flex flex-wrap items-center gap-3"><Badge className="rounded-sm bg-[#F4E2DC] text-[#9F402F] hover:bg-[#F4E2DC]" data-testid={`discussion-tag-${post.post_id}`}>{post.tag}</Badge><span className="text-sm text-[#60706A]" data-testid={`discussion-author-${post.post_id}`}>{post.author_name}</span></div><CardTitle className="text-2xl" data-testid={`discussion-title-${post.post_id}`}>{post.title}</CardTitle></CardHeader>
              <CardContent className="space-y-5"><p className="text-[#4A5A55]" data-testid={`discussion-body-${post.post_id}`}>{post.body}</p><Button variant="outline" onClick={() => toggleComments(post.post_id)} className="rounded-sm border-[#163832] text-[#163832] hover:bg-[#163832] hover:text-white" data-testid={`discussion-comments-button-${post.post_id}`}>{comments[post.post_id] ? "Hide" : "Show"} comments</Button>{comments[post.post_id] && <div className="comment-box" data-testid={`comments-box-${post.post_id}`}>{comments[post.post_id].map((comment) => <div className="comment" key={comment.comment_id} data-testid={`comment-${comment.comment_id}`}><strong data-testid={`comment-author-${comment.comment_id}`}>{comment.author_name}</strong><p data-testid={`comment-body-${comment.comment_id}`}>{comment.body}</p></div>)}<div className="flex gap-3"><Input value={commentInput[post.post_id] || ""} onChange={(e) => setCommentInput({ ...commentInput, [post.post_id]: e.target.value })} placeholder="Add a thoughtful comment" className="field-input" data-testid={`comment-input-${post.post_id}`} /><Button onClick={() => addComment(post.post_id)} className="rounded-sm bg-[#CC5A47] text-white hover:bg-[#DF6C59] hover:text-white" data-testid={`comment-submit-${post.post_id}`}>Reply</Button></div></div>}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const loadMessages = useCallback(() => apiFetch("/messages").then((data) => setMessages(data.items || [])), []);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  const send = async () => {
    const content = input.trim();
    if (!content) return;
    try {
      const msg = await apiFetch("/messages", { method: "POST", body: JSON.stringify({ content }) });
      setMessages([...messages, msg]);
      setInput("");
      setNotice("");
    } catch (err) { setNotice(err.message); }
  };
  return (
    <AppShell>
      <section className="help-page" data-testid="messages-page">
        <PageHeader eyebrow="Partner thread" title="Messages" description="Text directly with your paired partner once a CommonGround pair is active." />
        <div className="chat-panel" data-testid="messages-thread-panel">{messages.length === 0 && <p className="text-[#4A5A55]" data-testid="messages-empty-state">No direct messages yet.</p>}{messages.map((message) => <div key={message.message_id} className={`chat-bubble ${message.user_id === user?.user_id ? "user" : "guide"}`} data-testid={`direct-message-${message.message_id}`}><strong>{message.author_name}</strong><p>{message.content}</p></div>)}</div>
        {notice && <p className="error-banner mt-4" data-testid="messages-notice">{notice}</p>}
        <div className="chat-input" data-testid="messages-input-panel"><Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message to your partner..." className="field-input min-h-28" data-testid="messages-textarea" /><Button onClick={send} className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="messages-send-button">Send</Button></div>
      </section>
    </AppShell>
  );
}

function BentlyPage() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ role: "guide", text: "I’m Bently. Tell me what is happening and I’ll help name the pattern without taking sides." }]);
  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    try {
      const data = await apiFetch("/bently", { method: "POST", body: JSON.stringify({ message: text, mode: "solo" }) });
      setMessages((prev) => [...prev, { role: "guide", text: data.response, provider: data.provider }]);
    } catch (err) { setMessages((prev) => [...prev, { role: "guide", text: err.message }]); }
    setBusy(false);
  };
  return (
    <AppShell>
      <section className="help-page" data-testid="bently-page">
        <PageHeader eyebrow="Bently" title="AI relationship mediator" description="The repo’s Bently feature gives state-aware communication coaching for hard conversations." />
        <div className="chat-panel" data-testid="bently-chat-panel">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`} data-testid={`bently-message-${index}`}><p>{message.text}</p>{message.provider && <small data-testid={`bently-provider-${index}`}>{message.provider}</small>}</div>)}{busy && <div className="chat-bubble guide" data-testid="bently-thinking-message">Bently is reading the state...</div>}</div>
        <div className="chat-input" data-testid="bently-input-panel"><Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Say what’s actually happening..." className="field-input min-h-28" data-testid="bently-textarea" /><Button onClick={send} disabled={busy} className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="bently-send-button">Ask Bently</Button></div>
      </section>
    </AppShell>
  );
}

function MissionsPage() {
  const [missions, setMissions] = useState([]);
  const load = useCallback(() => apiFetch("/missions").then((data) => setMissions(data.items || [])), []);
  useEffect(() => { load(); }, [load]);
  const toggle = async (id) => { await apiFetch(`/missions/${id}/toggle`, { method: "POST" }); load(); };
  const completed = missions.filter((m) => m.completed).length;
  const pendingXp = missions.filter((m) => !m.completed).reduce((sum, m) => sum + (m.xp_reward || 0), 0);
  return <AppShell><section data-testid="missions-page"><PageHeader eyebrow="Missions" title="Relational missions" description="Complete repo-style growth tasks to earn XP and strengthen communication habits." /><div className="dashboard-grid" data-testid="mission-stats-grid"><Card className="metric-card"><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent><span className="metric-number" data-testid="missions-total-value">{missions.length}</span></CardContent></Card><Card className="metric-card"><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent><span className="metric-number" data-testid="missions-completed-value">{completed}</span></CardContent></Card><Card className="metric-card"><CardHeader><CardTitle>XP pending</CardTitle></CardHeader><CardContent><span className="metric-number" data-testid="missions-xp-pending-value">{pendingXp}</span></CardContent></Card></div><div className="post-list" data-testid="missions-list">{missions.map((mission) => <Card key={mission.mission_id} className="post-card" data-testid={`mission-card-${mission.mission_id}`}><CardContent className="p-6 flex items-start gap-4"><input type="checkbox" checked={mission.completed} onChange={() => toggle(mission.mission_id)} data-testid={`mission-toggle-${mission.mission_id}`} /><div><h3 className={mission.completed ? "line-through" : ""} data-testid={`mission-title-${mission.mission_id}`}>{mission.title}</h3><p className="text-[#4A5A55]" data-testid={`mission-description-${mission.mission_id}`}>{mission.description}</p><Badge className="mt-3 rounded-sm bg-[#E9E5D8] text-[#163832]">+{mission.xp_reward} XP · {mission.difficulty}</Badge></div></CardContent></Card>)}</div></section></AppShell>;
}

function XpPage() {
  const [xp, setXp] = useState(null);
  useEffect(() => { apiFetch("/xp").then(setXp); }, []);
  const next = xp?.next_rank;
  const current = xp?.current_rank;
  const pct = next ? Math.min(100, Math.round(((xp.current_xp - current.xp) / (next.xp - current.xp)) * 100)) : 100;
  return <AppShell><section data-testid="xp-page"><PageHeader eyebrow="Progression" title="XP & rank" description="Track relational growth, mission rewards, and CommonGround rank progression." />{xp && <><Card className="panel-card xp-hero" data-testid="xp-current-card"><CardContent className="p-8"><p className="section-label">Level {current.level}</p><h2 data-testid="xp-rank-name">{current.rank}</h2><span className="metric-number" data-testid="xp-current-value">{xp.current_xp} XP</span><div className="progress-track" data-testid="xp-progress-track"><div style={{ width: `${pct}%` }} /></div><p data-testid="xp-next-rank">{next ? `${pct}% to ${next.rank}` : "Top rank reached"}</p></CardContent></Card><div className="two-column mt-6"><Card className="panel-card" data-testid="rank-ladder-card"><CardHeader><CardTitle>Rank ladder</CardTitle></CardHeader><CardContent>{xp.rank_ladder.map((rank) => <div className="health-row" key={rank.rank} data-testid={`rank-row-${rank.rank.toLowerCase()}`}><span>Level {rank.level}: {rank.rank}</span><strong>{rank.xp} XP</strong></div>)}</CardContent></Card><Card className="panel-card" data-testid="xp-events-card"><CardHeader><CardTitle>Recent XP gains</CardTitle></CardHeader><CardContent>{xp.events.length === 0 && <p>No XP events yet.</p>}{xp.events.map((event) => <div className="health-row" key={event.event_id}><span>{event.source}</span><strong>+{event.amount}</strong></div>)}</CardContent></Card></div></>}</section></AppShell>;
}

function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", sentiment: "neutral" });
  const load = useCallback(() => apiFetch("/journal").then((data) => setEntries(data.items || [])), []);
  useEffect(() => { load(); }, [load]);
  const add = async (event) => { event.preventDefault(); await apiFetch("/journal", { method: "POST", body: JSON.stringify(form) }); setForm({ title: "", content: "", sentiment: "neutral" }); load(); };
  return <AppShell><section data-testid="journal-page"><PageHeader eyebrow="Journal" title="Private reflections" description="Capture thoughts, sentiment, and repair lessons — matching the repo’s journal flow." /><form onSubmit={add} className="discussion-form" data-testid="journal-form"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="field-input" data-testid="journal-title-input" /><Input value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })} placeholder="sentiment" className="field-input" data-testid="journal-sentiment-input" /><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Reflect freely..." className="field-input md:col-span-2 min-h-32" required data-testid="journal-content-input" /><Button className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="journal-save-button">Save entry</Button></form><div className="post-list" data-testid="journal-entry-list">{entries.map((entry) => <Card key={entry.entry_id} className="post-card" data-testid={`journal-entry-${entry.entry_id}`}><CardHeader><CardTitle>{entry.title}</CardTitle><Badge className="w-fit rounded-sm bg-[#F4E2DC] text-[#9F402F]">{entry.sentiment}</Badge></CardHeader><CardContent><p>{entry.content}</p></CardContent></Card>)}</div></section></AppShell>;
}

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().slice(0, 10), description: "", event_type: "checkin" });
  const load = useCallback(() => apiFetch("/calendar").then((data) => setEvents(data.items || [])), []);
  useEffect(() => { load(); }, [load]);
  const add = async (event) => { event.preventDefault(); await apiFetch("/calendar", { method: "POST", body: JSON.stringify(form) }); setForm({ ...form, title: "", description: "" }); load(); };
  return <AppShell><section data-testid="calendar-page"><PageHeader eyebrow="Calendar" title="Shared dates" description="Track check-ins, missions, anniversaries, and important CommonGround moments." /><form onSubmit={add} className="discussion-form" data-testid="calendar-form"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="field-input" data-testid="calendar-title-input" /><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="field-input" data-testid="calendar-date-input" /><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="field-input md:col-span-2" data-testid="calendar-description-input" /><Button className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="calendar-add-button">Add event</Button></form><div className="post-list" data-testid="calendar-event-list">{events.map((item) => <Card key={item.event_id} className="post-card" data-testid={`calendar-event-${item.event_id}`}><CardContent className="p-6 flex justify-between gap-4"><div><h3>{item.title}</h3><p className="text-[#4A5A55]">{item.description}</p></div><Badge className="h-fit rounded-sm bg-[#163832] text-white">{item.date}</Badge></CardContent></Card>)}</div></section></AppShell>;
}

function VaultPage() {
  const [data, setData] = useState({ items: [], categories: [] });
  const [form, setForm] = useState({ title: "", category: "Memory", note: "" });
  const load = useCallback(() => apiFetch("/vault").then(setData), []);
  useEffect(() => { load(); }, [load]);
  const add = async (event) => { event.preventDefault(); await apiFetch("/vault", { method: "POST", body: JSON.stringify(form) }); setForm({ title: "", category: "Memory", note: "" }); load(); };
  return <AppShell><section data-testid="vault-page"><PageHeader eyebrow="DeeplyUs" title="Shared vault" description="A repo-inspired vault for memories, milestones, letters, and shared goals." /><div className="dashboard-grid" data-testid="vault-category-grid">{data.categories.map((cat) => <Card className="metric-card" key={cat.title} data-testid={`vault-category-${cat.title.toLowerCase()}`}><CardHeader><CardTitle>{cat.title}</CardTitle></CardHeader><CardContent><span className="metric-number">{cat.count}</span><p>items</p></CardContent></Card>)}</div><form onSubmit={add} className="discussion-form" data-testid="vault-form"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Memory or milestone title" className="field-input" required data-testid="vault-title-input" /><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field-input" data-testid="vault-category-input" /><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why it matters" className="field-input md:col-span-2" data-testid="vault-note-input" /><Button className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="vault-add-button">Add to vault</Button></form><div className="post-list" data-testid="vault-item-list">{data.items.map((item) => <Card key={item.item_id} className="post-card" data-testid={`vault-item-${item.item_id}`}><CardHeader><CardTitle>{item.title}</CardTitle><Badge className="w-fit rounded-sm bg-[#E9E5D8] text-[#163832]">{item.category}</Badge></CardHeader><CardContent><p>{item.note}</p></CardContent></Card>)}</div></section></AppShell>;
}

function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { apiFetch("/settings").then(setSettings); }, []);
  const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });
  const save = async () => { setSettings(await apiFetch("/settings", { method: "PATCH", body: JSON.stringify(settings) })); setSaved(true); };
  return <AppShell><section data-testid="settings-page"><PageHeader eyebrow="Settings" title="Preferences" description="Manage account, notifications, language, privacy, and pair safety controls." />{settings && <div className="two-column"><Card className="panel-card" data-testid="settings-account-card"><CardHeader><CardTitle>Account</CardTitle></CardHeader><CardContent className="space-y-3"><p data-testid="settings-email">{user.email}</p><p data-testid="settings-role">Role: {user.role}</p><Button variant="outline" className="rounded-sm" data-testid="settings-change-password-button">Change password</Button></CardContent></Card><Card className="panel-card" data-testid="settings-notifications-card"><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-4"><label className="health-row">Push notifications <input type="checkbox" checked={settings.notifications_enabled} onChange={() => toggle("notifications_enabled")} data-testid="settings-notifications-toggle" /></label><label className="health-row">Email digest <input type="checkbox" checked={settings.email_digest} onChange={() => toggle("email_digest")} data-testid="settings-email-toggle" /></label><Input value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="field-input" data-testid="settings-language-input" /><Button onClick={save} className="rounded-sm bg-[#163832] text-white hover:bg-[#215249] hover:text-white" data-testid="settings-save-button">Save settings</Button>{saved && <p className="text-sm font-bold text-[#2D6A4F]" data-testid="settings-saved-message">Settings saved</p>}</CardContent></Card><Card className="panel-card" data-testid="settings-privacy-card"><CardHeader><CardTitle>Privacy & data</CardTitle></CardHeader><CardContent><p>Your private reflections and direct messages stay inside your CommonGround account.</p><Button variant="outline" className="mt-4 rounded-sm" data-testid="settings-download-data-button">Download my data</Button></CardContent></Card><Card className="panel-card danger" data-testid="settings-danger-card"><CardHeader><CardTitle>Danger zone</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" className="w-full rounded-sm border-[#E63946] text-[#E63946]" data-testid="settings-disconnect-button">Disconnect from partner</Button><Button variant="outline" className="w-full rounded-sm border-[#E63946] text-[#E63946]" data-testid="settings-delete-button">Delete account</Button></CardContent></Card></div>}</section></AppShell>;
}

function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/admin/overview").then(setData).catch((err) => setError(err.message)); }, []);
  return (
    <AppShell>
      <section data-testid="admin-page">
        <PageHeader eyebrow="Admin" title="Community overview" description="Monitor membership, discussion activity, and communication health signals." />
        {error && <p className="error-banner" data-testid="admin-error-message">{error}</p>}
        {data && <><div className="dashboard-grid" data-testid="admin-stats-grid">{Object.entries(data.stats).map(([key, value]) => <Card className="metric-card" key={key} data-testid={`admin-stat-${key}`}><CardHeader><CardTitle className="capitalize" data-testid={`admin-stat-title-${key}`}>{key.replaceAll("_", " ")}</CardTitle></CardHeader><CardContent><span className="metric-number" data-testid={`admin-stat-value-${key}`}>{value}</span></CardContent></Card>)}</div><div className="two-column" data-testid="admin-detail-grid"><Card className="panel-card" data-testid="admin-health-card"><CardHeader><CardTitle>Health signals</CardTitle></CardHeader><CardContent>{data.health.map((item) => <div className="health-row" key={item.label} data-testid={`health-row-${item.label.toLowerCase().replaceAll(" ", "-")}`}><span>{item.label}</span><strong>{item.value}%</strong></div>)}</CardContent></Card><Card className="panel-card" data-testid="admin-users-card"><CardHeader><CardTitle>Recent users</CardTitle></CardHeader><CardContent>{data.recent_users.map((member) => <div className="member-row" key={member.user_id} data-testid={`recent-user-${member.user_id}`}><span>{member.name}</span><small>{member.email}</small></div>)}</CardContent></Card></div></>}
      </section>
    </AppShell>
  );
}

function AppRoutes() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/pair" element={<ProtectedRoute><PairPage /></ProtectedRoute>} />
      <Route path="/matching" element={<ProtectedRoute><MatchingPage /></ProtectedRoute>} />
      <Route path="/discussions" element={<ProtectedRoute><DiscussionsPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/bently" element={<ProtectedRoute><BentlyPage /></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
      <Route path="/xp" element={<ProtectedRoute><XpPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
