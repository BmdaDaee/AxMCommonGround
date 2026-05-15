import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';

type RelationalState = 'ALIGNED' | 'DORMANT' | 'MISALIGNED' | 'CAPACITY_BLOCKED' | 'TRUST_FRACTURED';

const STATE_CONFIG: Record<RelationalState, {
  color: string;
  border: string;
  label: string;
  description: string;
}> = {
  ALIGNED: {
    color: '#10B981',
    border: 'border-[#10B981]',
    label: 'Aligned',
    description: 'Both of you are showing up. The channel is open.',
  },
  DORMANT: {
    color: '#6B7280',
    border: 'border-[#6B7280]',
    label: 'Dormant',
    description: 'Things are stable but low-energy. The comfort is real — so is the drift.',
  },
  MISALIGNED: {
    color: '#F59E0B',
    border: 'border-[#F59E0B]',
    label: 'Misaligned',
    description: 'You have capacity. Your meanings are diverging. Not a crisis — a gap.',
  },
  CAPACITY_BLOCKED: {
    color: '#9D4EDD',
    border: 'border-[#9D4EDD]',
    label: 'Capacity Blocked',
    description: 'One or both of you is near limit. Deeper work is not available right now.',
  },
  TRUST_FRACTURED: {
    color: '#E63946',
    border: 'border-[#E63946]',
    label: 'Trust Fractured',
    description: 'Something broke. Repair requires action, not reassurance.',
  },
};

function metricLabel(value: number): { label: string; color: string } {
  if (value >= 70) return { label: 'HIGH', color: '#10B981' };
  if (value >= 40) return { label: 'MED', color: '#F59E0B' };
  return { label: 'LOW', color: '#E63946' };
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const pairQuery = trpc.pairs.getMyPair.useQuery();
  const pairId = pairQuery.data?.id;

  const stateQuery = trpc.pairs.getRelationalState.useQuery(
    { pairId: pairId! },
    { enabled: !!pairId, refetchInterval: 60000 }
  );

  const isLoading = pairQuery.isLoading || stateQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080] animate-pulse">
          Reading state...
        </p>
      </div>
    );
  }

  if (!pairQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6">
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080]">
          No active pair
        </p>
        <button
          onClick={() => navigate('/invite')}
          className="bg-[#D4AF37] text-[#080808] px-8 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#E8C547] transition-colors"
        >
          Invite Partner
        </button>
      </div>
    );
  }

  const state = (stateQuery.data?.state ?? 'DORMANT') as RelationalState;
  const metrics = (stateQuery.data?.metrics ?? {}) as Record<string, number>;
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.DORMANT;
  const explanation = (stateQuery.data as any)?.explanation ?? config.description;

  const dimensions = [
    { key: 'availability', label: 'Availability' },
    { key: 'alignment', label: 'Alignment' },
    { key: 'activation', label: 'Activation' },
    { key: 'trust', label: 'Trust' },
  ];

  return (
    <div className="space-y-8">
      {/* State hero */}
      <div className={`border-l-4 ${config.border} pl-8 py-6`}>
        <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-3">
          Relational State
        </p>
        <h1
          className="font-mono text-6xl uppercase tracking-tighter mb-4"
          style={{ color: config.color }}
        >
          {config.label}
        </h1>
        <p className="text-[#B0B0B0] text-sm leading-relaxed max-w-lg">
          {explanation}
        </p>
      </div>

      {/* Dimension metrics */}
      <div className="border border-[#1E1E1E] bg-[#0F0F0F]">
        <div className="px-6 py-4 border-b border-[#1E1E1E]">
          <p className="font-mono text-xs uppercase tracking-widest text-[#808080]">
            Signal Dimensions
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[#1E1E1E]">
          {dimensions.map(({ key, label }) => {
            const value = metrics[key] ?? 50;
            const { label: lvl, color } = metricLabel(value);
            return (
              <div key={key} className="px-6 py-5">
                <p className="font-mono text-xs uppercase tracking-widest text-[#808080] mb-2">
                  {label}
                </p>
                <div className="flex items-end gap-3">
                  <p
                    className="font-mono text-2xl uppercase tracking-tighter"
                    style={{ color }}
                  >
                    {lvl}
                  </p>
                  <p className="font-mono text-xs text-[#808080] mb-1">
                    {value}/100
                  </p>
                </div>
                {/* Bar */}
                <div className="mt-3 h-0.5 bg-[#1E1E1E] w-full">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/bently')}
          className="flex-1 bg-[#D4AF37] text-[#080808] py-4 font-mono text-xs uppercase tracking-widest hover:bg-[#E8C547] transition-colors"
        >
          Talk to Bently
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="flex-1 border border-[#1E1E1E] text-[#B0B0B0] py-4 font-mono text-xs uppercase tracking-widest hover:border-[#2A2A2A] hover:text-[#F5F5F5] transition-colors"
        >
          Messages
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
