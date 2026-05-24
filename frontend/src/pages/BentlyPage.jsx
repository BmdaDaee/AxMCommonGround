import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function BentlyPage({ user }) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [entries, setEntries] = useState([]);
  const historyQuery = useQuery({ queryKey: ['bently-history'], queryFn: () => api('/bently/history') });

  useEffect(() => {
    if (historyQuery.data?.items) setEntries(historyQuery.data.items.map((entry) => ({ id: entry.id || crypto.randomUUID(), role: entry.author === 'bently' ? 'ai' : 'user', content: entry.content })));
  }, [historyQuery.data?.items]);

  const bentlyMutation = useMutation({
    mutationFn: () => api('/bently', { method: 'POST', body: JSON.stringify({ message: prompt }) }),
    onSuccess: (data) => {
      setEntries((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: prompt }, { id: crypto.randomUUID(), role: 'ai', content: data.response, state: data.state, xp: data.xp, rank: data.rank }]);
      setPrompt('');
      queryClient.invalidateQueries({ queryKey: ['bently-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="bently-page-eyebrow">AI mediator</p>
        <h2 data-testid="bently-page-title">Let Bently read the middle, not just the message.</h2>
      </div>

      <div className="panel page-stack">
        <div className="state-card" data-testid="bently-intro-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkle size={20} weight="duotone" />
            <strong data-testid="bently-intro-heading">{user?.name}, this can be solo or paired.</strong>
          </div>
          <p className="page-subtitle" data-testid="bently-intro-copy">Bently answers as a relational mediator — direct, non-performative, and state-aware when a partner is connected.</p>
        </div>

        <div className="chat-list" data-testid="bently-thread-list">
          {entries.length === 0 && <div className="empty-card" data-testid="bently-empty-state"><h3 className="section-title">Start anywhere.</h3><p className="page-subtitle">Try: “We keep missing each other when stress is high” or “How do I bring up distance without making it worse?”</p></div>}
          {entries.map((entry) => (
            <div key={entry.id} className={`message-row ${entry.role === 'user' ? 'self' : 'ai'}`} data-testid={`bently-entry-${entry.id}`}>
              <div className="message-bubble">
                <p className="eyebrow">{entry.role === 'user' ? 'You' : 'Bently'}</p>
                <div data-testid={`bently-entry-content-${entry.id}`}>{entry.content}</div>
                {entry.role === 'ai' && entry.state && <div className="message-meta" data-testid={`bently-entry-meta-${entry.id}`}>{entry.state} · {entry.rank} · {entry.xp} XP</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="composer" data-testid="bently-composer">
          <textarea className="textarea" rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe what feels true between you two right now." data-testid="bently-composer-input" />
          <button className="button button-accent" onClick={() => bentlyMutation.mutate()} disabled={!prompt.trim() || bentlyMutation.isPending} data-testid="bently-send-button">
            {bentlyMutation.isPending ? 'Bently is thinking…' : 'Ask Bently'}
          </button>
        </div>
      </div>
    </section>
  );
}