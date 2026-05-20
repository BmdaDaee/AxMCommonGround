import React from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';

type RelationalState = 'ALIGNED' | 'DORMANT' | 'MISALIGNED' | 'CAPACITY_BLOCKED' | 'TRUST_FRACTURED';

const STATE_CONFIG: Record<RelationalState, {
  color: string;
  label: string;
  description: string;
}> = {
  ALIGNED: {
    color: '#10B981',
    label: 'Aligned',
    description: 'Both of you are showing up. The channel is open.',
  },
  DORMANT: {
    color: '#6B7280',
    label: 'Dormant',
    description: 'Things are stable but low-energy. The comfort is real — so is the drift.',
  },
  MISALIGNED: {
    color: '#F59E0B',
    label: 'Misaligned',
    description: 'You have capacity. Your meanings are diverging. Not a crisis — a gap.',
  },
  CAPACITY_BLOCKED: {
    color: '#9D4EDD',
    label: 'Capacity Blocked',
    description: 'One or both of you is near limit. Deeper work is not available right now.',
  },
  TRUST_FRACTURED: {
    color: '#E63946',
    label: 'Trust Fractured',
    description: 'Something broke. Repair requires action, not reassurance.',
  },
};

function metricLabel(value: number): { label: string; color: string } {
  if (value >= 70) return { label: 'Strong', color: '#10B981' };
  if (value >= 40) return { label: 'Moderate', color: '#F59E0B' };
  return { label: 'Low', color: '#E63946' };
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
        <p className="text-sm text-[#999] animate-pulse">Reading your state...</p>
      </div>
    );
  }

  if (!pairQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-8">
        <div className="text-center">
          <h2 className="text-2xl mb-2">No active partnership</h2>
          <p className="text-[#999] text-sm">Start a connection to begin.</p>
        </div>
        <button
          onClick={() => navigate('/invite')}
          className="btn-primary"
        >
          Invite a Partner
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
    <div className="space-y-12">
      {/* State Hero */}
      <div className="border-l-4 pl-8 py-4" style={{ borderColor: config.color }}>
        <p className="label">Relational State</p>
        <h1 className="mb-4" style={{ color: config.color }}>
          {config.label}
        </h1>
        <p className="text-[#666] leading-relaxed max-w-2xl">
          {explanation}
        </p>
      </div>

      {/* Dimension Metrics */}
      <div className="card">
        <p className="label mb-6">Signal Dimensions</p>
        <div className="grid grid-cols-2 gap-8">
          {dimensions.map(({ key, label }) => {
            const value = metrics[key] ?? 50;
            const { label: lvl, color } = metricLabel(value);
            return (
              <div key={key}>
                <p className="label">{label}</p>
                <div className="flex items-end gap-4 mb-4">
                  <p className="text-3xl font-serif" style={{ color }}>
                    {lvl}
                  </p>
                  <p className="text-sm text-[#999]">{value}/100</p>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-[#e8e6e3] rounded-full overflow-hidden">
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

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/bently')}
          className="btn-primary py-4 text-base"
        >
          Talk to Bently
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="btn-secondary py-4 text-base"
        >
          Messages
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;

