import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '../lib/trpc';

type RelationalState = 'ALIGNED' | 'DORMANT' | 'MISALIGNED' | 'CAPACITY_BLOCKED' | 'TRUST_FRACTURED';

interface BentlyEntry {
  id: string;
  userMessage: string;
  response: string;
  state: RelationalState;
  xpEarned: number;
  timestamp: Date;
}

const STATE_LABELS: Record<RelationalState, string> = {
  ALIGNED: 'Aligned',
  DORMANT: 'Dormant',
  MISALIGNED: 'Misaligned',
  CAPACITY_BLOCKED: 'Capacity Blocked',
  TRUST_FRACTURED: 'Trust Fractured',
};

const STATE_COLORS: Record<RelationalState, string> = {
  ALIGNED: '#10B981',
  DORMANT: '#6B7280',
  MISALIGNED: '#F59E0B',
  CAPACITY_BLOCKED: '#9D4EDD',
  TRUST_FRACTURED: '#E63946',
};

const ThinkingDots: React.FC = () => {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const i = setInterval(() => setDots((d) => (d % 3) + 1), 600);
    return () => clearInterval(i);
  }, []);
  return (
    <span className="font-mono text-xs text-[#808080]">
      {'█'.repeat(dots)}{'░'.repeat(3 - dots)}
    </span>
  );
};

export const BentlyPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<BentlyEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const stateQuery = trpc.pairs.getRelationalState.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId }
  );

  const coachMutation = trpc.bently.coach.useMutation({
    onSuccess: (data, variables) => {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userMessage: variables.message,
          response: data.response,
          state: data.state as RelationalState,
          xpEarned: data.xpEarned,
          timestamp: new Date(),
        },
      ]);
      setIsThinking(false);
    },
    onError: () => setIsThinking(false),
  });

  const soloMutation = trpc.bently.coachSolo.useMutation({
    onSuccess: (data, variables) => {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userMessage: variables.message,
          response: data.response,
          state: 'DORMANT',
          xpEarned: 0,
          timestamp: new Date(),
        },
      ]);
      setIsThinking(false);
    },
    onError: () => setIsThinking(false),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, isThinking]);

  const handleSubmit = () => {
    const message = input.trim();
    if (!message || isThinking) return;

    setInput('');
    setIsThinking(true);

    if (pairId) {
      coachMutation.mutate({ pairId, message, provider: 'claude' });
    } else {
      soloMutation.mutate({ message });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentState = (stateQuery.data?.state ?? 'DORMANT') as RelationalState;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-1">
            Bently
          </p>
          <h1 className="font-mono text-3xl uppercase tracking-tighter text-[#F5F5F5]">
            What's happening?
          </h1>
        </div>
        {pairId && stateQuery.data && (
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-1">
              Reading this as
            </p>
            <p
              className="font-mono text-sm uppercase tracking-widest"
              style={{ color: STATE_COLORS[currentState] }}
            >
              {STATE_LABELS[currentState]}
            </p>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto space-y-8 mb-6 pr-1">
        {entries.length === 0 && !isThinking && (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-xs uppercase tracking-widest text-[#2A2A2A]">
              Write something. Bently is reading the state.
            </p>
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-4">
            {/* User message */}
            <div className="flex justify-end">
              <p className="font-mono text-sm text-[#B0B0B0] max-w-lg text-right leading-relaxed">
                {entry.userMessage}
              </p>
            </div>

            {/* Bently response */}
            <div className="border-l-2 border-[#D4AF37] pl-6 py-2">
              <p className="text-[#F5F5F5] text-sm leading-relaxed mb-3">
                {entry.response}
              </p>
              <div className="flex items-center gap-4">
                {entry.xpEarned > 0 && (
                  <p className="font-mono text-xs text-[#D4AF37] uppercase tracking-widest">
                    +{entry.xpEarned} xp
                  </p>
                )}
                <p className="font-mono text-xs text-[#808080] uppercase tracking-widest"
                   style={{ color: STATE_COLORS[entry.state] }}>
                  {STATE_LABELS[entry.state]}
                </p>
                <p className="font-mono text-xs text-[#808080]">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="border-l-2 border-[#1E1E1E] pl-6 py-4">
            <ThinkingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border border-[#1E1E1E] bg-[#0F0F0F] focus-within:border-[#D4AF37] transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say what's actually happening..."
          rows={3}
          disabled={isThinking}
          className="w-full bg-transparent text-[#F5F5F5] text-sm leading-relaxed px-5 pt-4 pb-2 outline-none resize-none placeholder:text-[#2A2A2A] font-sans disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-5 pb-4">
          <p className="font-mono text-xs text-[#808080]">
            ↵ to send · shift+↵ for newline
          </p>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isThinking}
            className="font-mono text-xs uppercase tracking-widest text-[#D4AF37] hover:text-[#E8C547] disabled:text-[#2A2A2A] disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default BentlyPage;
