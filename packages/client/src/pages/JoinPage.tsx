import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const acceptInvite = trpc.pairs.acceptInvite.useMutation({
    onSuccess: () => navigate('/dashboard'),
    onError: (err) => setError(err.message ?? 'Invalid or expired code.'),
  });

  const handleSubmit = () => {
    if (code.length !== 8) {
      setError('Code must be 8 characters.');
      return;
    }
    setError('');
    acceptInvite.mutate({ code });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(val);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-2">
          CommonGround
        </p>
        <h1 className="font-mono text-4xl uppercase tracking-tighter text-[#F5F5F5] mb-3">
          Enter Code
        </h1>
        <p className="text-[#808080] text-sm leading-relaxed mb-12">
          Your partner generated a code. Enter it here to connect.
        </p>

        <div className="mb-2">
          <input
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="A1B2C3D4"
            maxLength={8}
            autoFocus
            className="w-full bg-[#0F0F0F] border border-[#1E1E1E] focus:border-[#D4AF37] text-[#D4AF37] font-mono text-3xl tracking-[0.3em] text-center py-6 outline-none transition-colors placeholder:text-[#2A2A2A]"
          />
        </div>

        {error && (
          <p className="font-mono text-xs text-[#E63946] uppercase tracking-widest mb-6 px-1">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={code.length !== 8 || acceptInvite.isPending}
            className="flex-1 bg-[#D4AF37] text-[#080808] py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#E8C547] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {acceptInvite.isPending ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={() => navigate('/invite')}
            className="flex-1 border border-[#1E1E1E] text-[#B0B0B0] py-3 font-mono text-xs uppercase tracking-widest hover:border-[#2A2A2A] hover:text-[#F5F5F5] transition-colors"
          >
            Generate Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
