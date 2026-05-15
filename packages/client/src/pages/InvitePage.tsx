import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

export const InvitePage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  const statusQuery = trpc.pairs.getInviteStatus.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const createInvite = trpc.pairs.createInvite.useMutation();

  useEffect(() => {
    if (!statusQuery.data?.pending && !statusQuery.isLoading) {
      createInvite.mutate();
    }
  }, [statusQuery.isLoading]);

  useEffect(() => {
    if (statusQuery.data?.pairId) {
      navigate('/dashboard');
    }
  }, [statusQuery.data]);

  useEffect(() => {
    const expiresAt = statusQuery.data?.expiresAt ?? createInvite.data?.expiresAt;
    if (!expiresAt) return;
    const date = new Date(expiresAt);
    setCountdown(formatCountdown(date));
    const interval = setInterval(() => setCountdown(formatCountdown(date)), 60000);
    return () => clearInterval(interval);
  }, [statusQuery.data?.expiresAt, createInvite.data?.expiresAt]);

  const code = statusQuery.data?.code ?? createInvite.data?.code;

  const handleCopy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(() => {
    if (!code) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on CommonGround',
        text: `Use this code to pair with me: ${code}`,
      });
    } else {
      handleCopy();
    }
  }, [code]);

  const isLoading = statusQuery.isLoading || createInvite.isPending;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-2">
          CommonGround
        </p>
        <h1 className="font-mono text-4xl uppercase tracking-tighter text-[#F5F5F5] mb-3">
          Invite Your Partner
        </h1>
        <p className="text-[#808080] text-sm leading-relaxed mb-12">
          Share this code. When they enter it, your shared space activates.
        </p>

        {isLoading ? (
          <div className="border border-[#1E1E1E] p-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#808080] animate-pulse">
              Generating code...
            </p>
          </div>
        ) : code ? (
          <>
            <button
              onClick={handleCopy}
              className="w-full border border-[#2A2A2A] hover:border-[#D4AF37] bg-[#0F0F0F] p-10 text-center transition-colors group mb-4"
            >
              <p className="font-mono text-5xl tracking-[0.3em] text-[#D4AF37] mb-3 group-hover:text-[#E8C547] transition-colors">
                {code}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-[#808080] group-hover:text-[#B0B0B0] transition-colors">
                {copied ? '✓ Copied' : 'Tap to copy'}
              </p>
            </button>

            <div className="flex items-center justify-between mb-8 px-1">
              <p className="font-mono text-xs text-[#808080] uppercase tracking-widest">
                {countdown}
              </p>
              <p className="font-mono text-xs text-[#808080] uppercase tracking-widest">
                48h window
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 bg-[#D4AF37] text-[#080808] py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#E8C547] transition-colors"
              >
                Share Code
              </button>
              <button
                onClick={() => navigate('/join')}
                className="flex-1 border border-[#1E1E1E] text-[#B0B0B0] py-3 font-mono text-xs uppercase tracking-widest hover:border-[#2A2A2A] hover:text-[#F5F5F5] transition-colors"
              >
                I Have a Code
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-[#1E1E1E] text-center">
              <p className="font-mono text-xs text-[#808080] uppercase tracking-widest">
                Waiting for partner to connect
                <span className="animate-pulse">...</span>
              </p>
            </div>
          </>
        ) : (
          <p className="font-mono text-xs text-[#E63946] uppercase tracking-widest text-center">
            Failed to generate code. Refresh to try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
