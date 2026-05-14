import React from 'react';
import { cn } from '@/lib/utils';

interface RelationalState {
  state: 'ALIGNED' | 'STALE' | 'ONE_SIDED_STRESS' | 'TENSION';
  lastUpdated: Date;
  description: string;
}

export const DashboardPage: React.FC = () => {
  const [relationalState] = React.useState<RelationalState>({
    state: 'ALIGNED',
    lastUpdated: new Date(),
    description: 'You two are communicating clearly and moving forward together.',
  });

  const stateConfig: Record<string, { color: string; icon: string; bg: string }> = {
    ALIGNED: {
      color: 'text-status-aligned',
      icon: '◆',
      bg: 'bg-status-aligned/10 border-status-aligned',
    },
    STALE: {
      color: 'text-status-stale',
      icon: '◐',
      bg: 'bg-status-stale/10 border-status-stale',
    },
    ONE_SIDED_STRESS: {
      color: 'text-status-stress',
      icon: '⚠',
      bg: 'bg-status-stress/10 border-status-stress',
    },
    TENSION: {
      color: 'text-status-tension',
      icon: '✕',
      bg: 'bg-status-tension/10 border-status-tension',
    },
  };

  const config = stateConfig[relationalState.state];

  return (
    <div className="p-lg space-y-lg">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold mb-sm">Dashboard</h2>
        <p className="text-text-secondary">Overview of your relational health.</p>
      </div>

      {/* Relational state card */}
      <div
        className={cn(
          'card-elevated border-2 p-2xl',
          config.bg
        )}
      >
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-sm">Relational State</h3>
            <p className="text-text-secondary text-sm">{relationalState.description}</p>
          </div>
          <div className={cn('text-5xl', config.color)}>{config.icon}</div>
        </div>

        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Current State</span>
            <span className={cn('px-md py-sm rounded-full text-xs font-bold', config.bg)}>
              {relationalState.state}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Last Updated</span>
            <span className="text-text-primary text-sm">
              {relationalState.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="card">
          <h4 className="text-sm font-semibold text-text-secondary mb-lg">Unread Messages</h4>
          <p className="text-4xl font-bold text-primary">3</p>
          <p className="text-xs text-text-tertiary mt-sm">From your partner</p>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-text-secondary mb-lg">Pending Missions</h4>
          <p className="text-4xl font-bold text-accent">2</p>
          <p className="text-xs text-text-tertiary mt-sm">This week</p>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-text-secondary mb-lg">XP Earned</h4>
          <p className="text-4xl font-bold text-highlight">125</p>
          <p className="text-xs text-text-tertiary mt-sm">This month</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section-divider">
        <h3 className="text-lg font-semibold mb-lg">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <button className="btn-primary w-full">Send a Message</button>
          <button className="btn-secondary w-full">Start Bently Chat</button>
          <button className="btn-ghost w-full">View Journal</button>
          <button className="btn-accent w-full">Browse Missions</button>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="text-lg font-semibold mb-lg">Recent Activity</h3>
        <div className="space-y-md">
          {[
            { time: '2 hours ago', action: 'Your partner sent a message', type: 'message' },
            { time: '5 hours ago', action: 'Relational state updated to ALIGNED', type: 'state' },
            {
              time: '1 day ago',
              action: 'Completed mission: "Have a difficult conversation"',
              type: 'mission',
            },
          ].map((activity, idx) => (
            <div key={idx} className="card hover-bg-surface cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-primary font-medium">{activity.action}</p>
                  <p className="text-xs text-text-tertiary">{activity.time}</p>
                </div>
                <span className="text-primary">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
