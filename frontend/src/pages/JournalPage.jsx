import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ prompt: 'What feels unsaid between us?', content: '', mood: 'Reflective' });
  const journalQuery = useQuery({ queryKey: ['journal'], queryFn: () => api('/journal') });
  const createEntry = useMutation({
    mutationFn: () => api('/journal', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      setForm((current) => ({ ...current, content: '' }));
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Reflection saved.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="journal-page-eyebrow">Private reflection</p>
        <h2 data-testid="journal-page-title">Write the part that needs room before it needs a fight.</h2>
      </div>

      <div className="split-layout">
        <article className="composer" data-testid="journal-form-card">
          <input className="field" value={form.prompt} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))} data-testid="journal-prompt-input" />
          <select className="select" value={form.mood} onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))} data-testid="journal-mood-select">
            <option>Reflective</option>
            <option>Hopeful</option>
            <option>Tender</option>
            <option>Frustrated</option>
          </select>
          <textarea className="textarea" rows={8} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Name what happened, what it stirred, and what you need next." data-testid="journal-content-input" />
          <button className="button button-primary" onClick={() => createEntry.mutate()} disabled={!form.content.trim() || createEntry.isPending} data-testid="journal-save-button">
            {createEntry.isPending ? 'Saving…' : 'Save reflection'}
          </button>
        </article>

        <article className="panel page-stack" data-testid="journal-entries-card">
          {(journalQuery.data?.items || []).map((entry) => (
            <div key={entry.id} className="journal-card" data-testid={`journal-entry-${entry.id}`}>
              <div className="chip-row">
                <span className="chip" data-testid={`journal-entry-mood-${entry.id}`}>{entry.mood}</span>
                <span className="chip" data-testid={`journal-entry-date-${entry.id}`}>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="section-title" data-testid={`journal-entry-prompt-${entry.id}`}>{entry.prompt}</h3>
              <p className="page-subtitle" data-testid={`journal-entry-content-${entry.id}`}>{entry.content}</p>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}