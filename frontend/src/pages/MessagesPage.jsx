import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatsCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function MessagesPage({ user }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const messagesQuery = useQuery({ queryKey: ['messages'], queryFn: () => api('/messages'), refetchInterval: 8000 });
  const sendMessage = useMutation({
    mutationFn: () => api('/messages', { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(error.message),
  });

  const pair = messagesQuery.data?.pair;
  const items = useMemo(() => messagesQuery.data?.items || [], [messagesQuery.data?.items]);

  if (!pair) {
    return <section className="empty-card" data-testid="messages-empty-pair-card"><h3 className="section-title">Messages unlock after pairing.</h3><p className="page-subtitle">Invite your partner first, then this thread becomes your shared running conversation.</p></section>;
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <p className="eyebrow" data-testid="messages-page-eyebrow">Direct thread</p>
        <h2 data-testid="messages-page-title">Speak to each other without leaving the room.</h2>
      </div>

      <div className="panel page-stack">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} data-testid="messages-thread-header">
          <ChatsCircle size={20} weight="duotone" />
          <strong>{pair.members?.map((member) => member.name).join(' · ')}</strong>
        </div>

        <div className="message-list" data-testid="messages-thread-list">
          {items.map((message) => {
            const self = message.userId === user?.id;
            return (
              <div key={message.id} className={`message-row ${self ? 'self' : ''}`} data-testid={`message-item-${message.id}`}>
                <div className="message-bubble">
                  {!self && <p className="eyebrow" data-testid={`message-author-${message.id}`}>{message.userName}</p>}
                  <div data-testid={`message-content-${message.id}`}>{message.content}</div>
                  <div className="message-meta" data-testid={`message-time-${message.id}`}>{new Date(message.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="composer" data-testid="messages-composer">
          <textarea className="textarea" rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Say what is true, not what sounds safe." data-testid="message-composer-input" />
          <button className="button button-primary" onClick={() => sendMessage.mutate()} disabled={!content.trim() || sendMessage.isPending} data-testid="message-send-button">
            {sendMessage.isPending ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </div>
    </section>
  );
}