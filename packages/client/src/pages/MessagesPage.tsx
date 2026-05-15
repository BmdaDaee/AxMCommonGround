import React, { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '../lib/trpc';

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: Date | string;
}

export const MessagesPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;
  const currentUserId = pairQuery.data?.user1Id;

  const messagesQuery = trpc.messages.getMessages.useQuery(
    { pairId: pairId!, limit: 50 },
    { enabled: !!pairId }
  );

  const sendMessage = trpc.messages.sendMessage.useMutation({
    onSuccess: (newMsg) => {
      setMessages((prev) => [...prev, newMsg as Message]);
    },
  });

  const loadOlderQuery = trpc.messages.getMessages.useQuery(
    { pairId: pairId!, limit: 50, cursor },
    { enabled: false }
  );

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.items as Message[]);
      setCursor(messagesQuery.data.nextCursor);
      setHasMore(!!messagesQuery.data.nextCursor);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = useCallback(async () => {
    if (!listRef.current || !hasMore || loadingOlder || !cursor) return;
    if (listRef.current.scrollTop < 80) {
      setLoadingOlder(true);
      const result = await loadOlderQuery.refetch();
      if (result.data) {
        const prevScrollHeight = listRef.current.scrollHeight;
        setMessages((prev) => [...(result.data!.items as Message[]), ...prev]);
        setCursor(result.data.nextCursor);
        setHasMore(!!result.data.nextCursor);
        // Maintain scroll position
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight - prevScrollHeight;
          }
        });
      }
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, cursor]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !pairId) return;
    setInput('');
    sendMessage.mutate({ pairId, content, type: 'TEXT' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!pairQuery.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080]">
          {pairQuery.isLoading ? 'Loading...' : 'No active pair'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-1">
          Messages
        </p>
        <h1 className="font-mono text-3xl uppercase tracking-tighter text-[#F5F5F5]">
          Thread
        </h1>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
      >
        {loadingOlder && (
          <div className="text-center py-2">
            <p className="font-mono text-xs text-[#808080] uppercase tracking-widest animate-pulse">
              Loading older...
            </p>
          </div>
        )}

        {hasMore && !loadingOlder && (
          <div className="text-center py-2">
            <p className="font-mono text-xs text-[#2A2A2A] uppercase tracking-widest">
              Scroll up for more
            </p>
          </div>
        )}

        {messagesQuery.isLoading && (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-xs uppercase tracking-widest text-[#808080] animate-pulse">
              Loading thread...
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isSelf = msg.userId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-sm ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    isSelf
                      ? 'bg-[#D4AF37] text-[#080808]'
                      : 'bg-[#1A1A1A] border border-[#1E1E1E] text-[#F5F5F5]'
                  }`}
                >
                  {msg.content}
                </div>
                <p className="font-mono text-xs text-[#808080]">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && !messagesQuery.isLoading && (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-xs uppercase tracking-widest text-[#2A2A2A]">
              No messages yet
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border border-[#1E1E1E] bg-[#0F0F0F] focus-within:border-[#D4AF37] transition-colors">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={2}
          className="w-full bg-transparent text-[#F5F5F5] text-sm leading-relaxed px-5 pt-4 pb-2 outline-none resize-none placeholder:text-[#2A2A2A] font-sans"
        />
        <div className="flex items-center justify-between px-5 pb-4">
          <p className="font-mono text-xs text-[#808080]">
            ↵ to send
          </p>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] hover:text-[#E8C547] disabled:text-[#2A2A2A] disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
