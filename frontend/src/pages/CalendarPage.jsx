import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', location: '', startDate: '', endDate: '', eventType: 'CHECK_IN' });
  const calendarQuery = useQuery({ queryKey: ['calendar'], queryFn: () => api('/calendar') });
  const createEvent = useMutation({
    mutationFn: () => api('/calendar', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      setForm({ title: '', description: '', location: '', startDate: '', endDate: '', eventType: 'CHECK_IN' });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Event added.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="calendar-page-eyebrow">Shared timeline</p>
        <h2 data-testid="calendar-page-title">Hold the rituals on the calendar before life crowds them out.</h2>
      </div>

      <div className="split-layout">
        <article className="composer" data-testid="calendar-form-card">
          <input className="field" placeholder="Event title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} data-testid="calendar-title-input" />
          <input className="field" placeholder="Location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} data-testid="calendar-location-input" />
          <textarea className="textarea" rows={3} placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} data-testid="calendar-description-input" />
          <input className="field" type="datetime-local" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} data-testid="calendar-start-input" />
          <input className="field" type="datetime-local" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} data-testid="calendar-end-input" />
          <select className="select" value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} data-testid="calendar-type-select">
            <option value="CHECK_IN">Check-in</option>
            <option value="DATE">Date</option>
            <option value="MILESTONE">Milestone</option>
          </select>
          <button className="button button-accent" onClick={() => createEvent.mutate()} disabled={!form.title || !form.startDate || !form.endDate || createEvent.isPending} data-testid="calendar-save-button">
            {createEvent.isPending ? 'Saving…' : 'Add event'}
          </button>
        </article>

        <article className="panel page-stack" data-testid="calendar-list-card">
          {(calendarQuery.data?.items || []).map((event) => (
            <div key={event.id} className="calendar-cell" data-testid={`calendar-event-${event.id}`}>
              <div className="chip-row">
                <span className="chip" data-testid={`calendar-event-type-${event.id}`}>{event.type}</span>
                <span className="chip" data-testid={`calendar-event-date-${event.id}`}>{new Date(event.startDate).toLocaleString()}</span>
              </div>
              <strong data-testid={`calendar-event-title-${event.id}`}>{event.title}</strong>
              <p className="page-subtitle" data-testid={`calendar-event-description-${event.id}`}>{event.description}</p>
              <p className="muted-copy" data-testid={`calendar-event-location-${event.id}`}>{event.location || 'No location added'}</p>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}