import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function SettingsPage({ authState }) {
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: () => api('/settings') });
  const [form, setForm] = useState({ notifications: true, weeklyDigest: true, language: 'English', theme: 'Editorial Earth' });

  useEffect(() => {
    if (settingsQuery.data?.settings) setForm(settingsQuery.data.settings);
  }, [settingsQuery.data?.settings]);

  const saveMutation = useMutation({
    mutationFn: () => api('/settings', { method: 'PUT', body: JSON.stringify(form) }),
    onSuccess: () => toast.success('Preferences saved.'),
    onError: (error) => toast.error(error.message),
  });

  const dissolveMutation = useMutation({
    mutationFn: () => api('/pairs/dissolve', { method: 'POST' }),
    onSuccess: () => toast.success('Pair dissolved.'),
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="settings-page-eyebrow">Preferences</p>
        <h2 data-testid="settings-page-title">Tune the room, the rhythm, and the notifications.</h2>
      </div>

      <div className="split-layout">
        <article className="panel page-stack" data-testid="settings-form-card">
          <label className="chip-row"><input type="checkbox" checked={form.notifications} onChange={(event) => setForm((current) => ({ ...current, notifications: event.target.checked }))} data-testid="settings-notifications-checkbox" /> <span>Push-style reminders</span></label>
          <label className="chip-row"><input type="checkbox" checked={form.weeklyDigest} onChange={(event) => setForm((current) => ({ ...current, weeklyDigest: event.target.checked }))} data-testid="settings-digest-checkbox" /> <span>Weekly digest</span></label>
          <select className="select" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} data-testid="settings-language-select">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
          <select className="select" value={form.theme} onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))} data-testid="settings-theme-select">
            <option>Editorial Earth</option>
            <option>Quiet Sage</option>
            <option>Warm Paper</option>
          </select>
          <button className="button button-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="settings-save-button">
            {saveMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        </article>

        <article className="panel page-stack" data-testid="settings-actions-card">
          <div className="mission-card">
            <p className="eyebrow">Account</p>
            <strong data-testid="settings-account-email">{authState.user?.email}</strong>
            <p className="page-subtitle">You’re signed into the editorial PWA experience and the same backend also powers the mobile app routes.</p>
          </div>
          <button className="button button-secondary" onClick={() => dissolveMutation.mutate()} data-testid="settings-dissolve-pair-button">Disconnect pair</button>
          <button className="button button-ghost" onClick={authState.onLogout} data-testid="settings-logout-button">Sign out everywhere on this browser</button>
        </article>
      </div>
    </section>
  );
}