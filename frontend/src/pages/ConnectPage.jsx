import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, ShareNetwork } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';

function InviteView({ countdown, createInvite, invite, shareCode }) {
  return (
    <div className="split-layout">
      <article className="hero-card">
        <div className="page-stack">
          <p className="page-subtitle" data-testid="invite-page-copy">The invite keeps the app calm until both people arrive. No noise, no pressure, just a clean doorway into the shared room.</p>
          <div className="empty-card" data-testid="invite-code-card">
            <p className="eyebrow">Your code</p>
            <h2 data-testid="invite-code-value">{invite?.code || 'Creating…'}</h2>
            <p className="page-subtitle" data-testid="invite-countdown-copy">{countdown}</p>
          </div>
          <div className="chip-row">
            <button className="button button-primary" onClick={() => navigator.clipboard.writeText(invite?.code || '').then(() => toast.success('Code copied.'))} data-testid="invite-copy-button" disabled={!invite?.code}>
              <Copy size={18} weight="bold" /> Copy code
            </button>
            <button className="button button-accent" onClick={shareCode} data-testid="invite-share-button" disabled={!invite?.code}>
              <ShareNetwork size={18} weight="bold" /> Share invite
            </button>
          </div>
        </div>

        <div className="mission-card" data-testid="invite-guidance-card">
          <p className="eyebrow">What happens next</p>
          <div className="page-stack">
            <p className="page-subtitle">Once they join, your dashboard wakes up, your shared messages open, and Bently can start reading the middle rather than either side alone.</p>
            <button className="button button-secondary" onClick={() => createInvite.mutate()} data-testid="invite-regenerate-button">Generate a fresh code</button>
          </div>
        </div>
      </article>
    </div>
  );
}

function JoinView({ code, joinInvite, navigate, setCode }) {
  return (
    <div className="split-layout">
      <article className="panel page-stack">
        <p className="page-subtitle" data-testid="join-page-copy">Use the exact eight-character code your partner generated. As soon as it matches, your shared dashboard becomes active.</p>
        <input className="field" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} placeholder="A1B2C3D4" data-testid="join-code-input" maxLength={8} />
        <button className="button button-primary full" onClick={() => joinInvite.mutate()} disabled={code.length !== 8 || joinInvite.isPending} data-testid="join-code-submit-button">
          {joinInvite.isPending ? 'Connecting…' : 'Connect our space'}
        </button>
      </article>

      <article className="panel page-stack" data-testid="join-guidance-card">
        <p className="eyebrow">Need a new code?</p>
        <h3 className="section-title" data-testid="join-guidance-title">You can always create another invite.</h3>
        <p className="page-subtitle">If the code expired or got lost, just generate a fresh one from your dashboard and try again.</p>
        <button className="button button-secondary" onClick={() => navigate('/invite')} data-testid="join-goto-invite-button">Generate a new code</button>
      </article>
    </div>
  );
}

export default function ConnectPage({ mode }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const statusQuery = useQuery({ queryKey: ['invite-status'], queryFn: () => api('/pairs/invite-status') });
  const createInvite = useMutation({
    mutationFn: () => api('/pairs/invite', { method: 'POST' }),
    onSuccess: () => statusQuery.refetch(),
    onError: (error) => toast.error(error.message),
  });
  const joinInvite = useMutation({
    mutationFn: () => api('/pairs/join', { method: 'POST', body: JSON.stringify({ code }) }),
    onSuccess: () => {
      toast.success('You are connected.');
      navigate('/dashboard');
    },
    onError: (error) => toast.error(error.message),
  });

  const invite = statusQuery.data?.invite;
  const pair = statusQuery.data?.pair;
  const shouldCreateInvite = mode === 'invite' && !pair && !invite && !createInvite.isPending;

  useEffect(() => {
    if (shouldCreateInvite) {
      createInvite.mutate();
    }
  }, [createInvite, shouldCreateInvite]);

  useEffect(() => {
    if (pair) {
      navigate('/dashboard');
    }
  }, [navigate, pair]);

  const countdown = !invite?.expiresAt
    ? '7 day invite window'
    : `${Math.max(0, Math.floor((new Date(invite.expiresAt).getTime() - Date.now()) / 3_600_000))} hours left`;

  const shareCode = async () => {
    if (!invite?.code) return;
    const text = `Join me on CommonGround with this code: ${invite.code}`;
    if (navigator.share) await navigator.share({ title: 'CommonGround invite', text });
    else await navigator.clipboard.writeText(invite.code);
    toast.success('Invite ready to send.');
  };

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="connect-page-eyebrow">Partnership setup</p>
        <h2 data-testid="connect-page-title">{mode === 'invite' ? 'Invite your partner into the space.' : 'Enter the code they shared with you.'}</h2>
      </div>

      {mode === 'invite'
        ? <InviteView countdown={countdown} createInvite={createInvite} invite={invite} shareCode={shareCode} />
        : <JoinView code={code} joinInvite={joinInvite} navigate={navigate} setCode={setCode} />}
    </section>
  );
}