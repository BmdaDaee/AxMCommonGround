import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkle, ChatsCircle, Heartbeat, Target, BellRinging, DotOutline } from '@phosphor-icons/react';
import { api } from '../lib/api';
import StatePill from '../components/StatePill';

const partnershipImage = 'https://images.unsplash.com/photo-1543829969-57899edf981b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxjb3VwbGUlMjBob2xkaW5nJTIwaGFuZHMlMjBzdW5zZXR8ZW58MHx8fHwxNzc5NjYxMzEwfDA&ixlib=rb-4.1.0&q=85';

function DashboardEmptyState() {
  return (
    <section className="page-stack">
      <div className="hero-card">
        <div className="page-stack hero-copy">
          <p className="eyebrow" data-testid="dashboard-empty-eyebrow">Shared space inactive</p>
          <h2 data-testid="dashboard-empty-title">You’re in. Now bring the second person in with you.</h2>
          <p className="page-subtitle" data-testid="dashboard-empty-copy">Everything is ready for the full experience — invite flow, partner messaging, journaling, and Bently — but the shared relationship layer waits for both people.</p>
          <div className="chip-row">
            <Link className="button button-primary" to="/invite" data-testid="dashboard-empty-invite-button">Create invite</Link>
            <Link className="button button-secondary" to="/join" data-testid="dashboard-empty-join-button">I have a code</Link>
          </div>
        </div>
        <div className="hero-image" style={{ backgroundImage: `url(${partnershipImage})` }} data-testid="dashboard-empty-image">
          <div className="hero-image-copy">
            <p className="eyebrow">Everything else is already waiting</p>
            <h3 data-testid="dashboard-empty-image-title">A dashboard, message thread, journal ritual, and Bently all wake up together.</h3>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardHero({ data, user }) {
  return (
    <div className="hero-card">
      <div className="page-stack hero-copy">
        <p className="eyebrow" data-testid="dashboard-page-eyebrow">Current relational weather</p>
        <StatePill state={data.state.state} />
        <h2 data-testid="dashboard-state-title">{data.partner?.name ? `${user?.name} + ${data.partner.name}` : 'Your shared space'} are currently reading as {String(data.state.state).replaceAll('_', ' ').toLowerCase()}.</h2>
        <p className="page-subtitle" data-testid="dashboard-state-explanation">{data.state.explanation}</p>
        <div className="chip-row">
          <Link className="button button-primary" to="/bently" data-testid="dashboard-talk-to-bently-button"><Sparkle size={18} weight="duotone" /> Talk to Bently</Link>
          <Link className="button button-secondary" to="/messages" data-testid="dashboard-open-messages-button"><ChatsCircle size={18} weight="duotone" /> Open messages</Link>
        </div>
      </div>

      <div className="hero-image" style={{ backgroundImage: `url(${partnershipImage})` }} data-testid="dashboard-hero-image">
        <div className="hero-image-copy">
          <p className="eyebrow">Shared partner</p>
          <h3 data-testid="dashboard-partner-name">{data.partner?.name || 'Partner connected'}</h3>
          <p data-testid="dashboard-rank-copy">{data.stats.rank} rank · {data.stats.xp} XP earned</p>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      <article className="stat-card" data-testid="dashboard-stat-messages"><ChatsCircle size={22} weight="duotone" /><div className="stat-value">{stats.messages}</div><p className="page-subtitle">Messages exchanged</p></article>
      <article className="stat-card" data-testid="dashboard-stat-journal"><Heartbeat size={22} weight="duotone" /><div className="stat-value">{stats.journalEntries}</div><p className="page-subtitle">Journal reflections</p></article>
      <article className="stat-card" data-testid="dashboard-stat-missions"><Target size={22} weight="duotone" /><div className="stat-value">{stats.completedMissions}</div><p className="page-subtitle">Completed missions</p></article>
    </div>
  );
}

function NotificationsGrid({ notifications }) {
  return (
    <div className="grid-two">
      <article className="panel page-stack" data-testid="dashboard-notifications-card">
        <div className="chip-row"><span className="chip"><BellRinging size={14} weight="duotone" /> Notifications</span></div>
        <h3 className="section-title">Unread and live presence.</h3>
        <p className="page-subtitle" data-testid="dashboard-unread-copy">
          {notifications.unreadMessages > 0 ? `You have ${notifications.unreadMessages} unread message${notifications.unreadMessages > 1 ? 's' : ''} waiting.` : 'Everything is caught up right now.'}
        </p>
        {notifications.partnerPresence && (
          <div className="presence-row" data-testid="dashboard-partner-presence-row">
            <span className={`presence-dot ${notifications.partnerPresence.isOnline ? 'online' : 'offline'}`} />
            <strong>{notifications.partnerPresence.name}</strong>
            <span>{notifications.partnerPresence.label}</span>
          </div>
        )}
      </article>

      <article className="panel page-stack" data-testid="dashboard-latest-unread-card">
        <div className="chip-row"><span className="chip"><DotOutline size={14} weight="duotone" /> Latest unread</span></div>
        <h3 className="section-title">{notifications.latestUnread?.userName || 'The room is quiet.'}</h3>
        <p className="page-subtitle" data-testid="dashboard-latest-unread-copy">{notifications.latestUnread?.content || 'When a new message lands, you’ll see it here with partner presence alongside it.'}</p>
      </article>
    </div>
  );
}

function MetricsPanel({ metrics }) {
  return (
    <article className="panel page-stack">
      <div className="page-header">
        <p className="eyebrow">Signal dimensions</p>
        <h3 className="section-title" data-testid="dashboard-metrics-title">How the middle looks right now.</h3>
      </div>
      {metrics.map(([key, value]) => (
        <div className="progress-row" key={key} data-testid={`dashboard-metric-${key}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong style={{ textTransform: 'capitalize' }}>{key}</strong>
            <span>{value}/100</span>
          </div>
          <div className="progress-track"><span style={{ width: `${value}%` }} /></div>
        </div>
      ))}
    </article>
  );
}

function UpcomingPanel({ upcoming }) {
  return (
    <article className="panel page-stack">
      <div className="page-header">
        <p className="eyebrow">What’s next</p>
        <h3 className="section-title" data-testid="dashboard-upcoming-title">Upcoming touchpoints and active rituals.</h3>
      </div>
      {upcoming.map((item) => (
        <div className="state-card" key={item.id} data-testid={`dashboard-upcoming-${item.id}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <strong>{item.title}</strong>
              <p className="page-subtitle">{item.description}</p>
            </div>
            <span className="chip">{new Date(item.startDate).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </article>
  );
}

function MissionGrid({ missions }) {
  return (
    <div className="grid-two">
      {missions.map((mission) => (
        <article className="mission-card" key={mission.id} data-testid={`dashboard-mission-${mission.id}`}>
          <p className="eyebrow">{mission.category}</p>
          <h3 className="section-title">{mission.title}</h3>
          <p className="page-subtitle">{mission.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function DashboardPage({ user }) {
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/dashboard') });
  const data = dashboardQuery.data;

  if (!data) {
    return <div className="screen-loader" data-testid="dashboard-loading-state">Loading dashboard…</div>;
  }

  if (!data.pair) {
    return <DashboardEmptyState />;
  }

  const metrics = Object.entries(data.state.metrics || {});
  const notifications = data.notifications || { unreadMessages: 0, partnerPresence: null };

  return (
    <section className="page-stack">
      <DashboardHero data={data} user={user} />
      <StatsGrid stats={data.stats} />
      <NotificationsGrid notifications={notifications} />

      <div className="split-layout">
        <MetricsPanel metrics={metrics} />
        <UpcomingPanel upcoming={data.upcoming} />
      </div>

      <MissionGrid missions={data.missions} />
    </section>
  );
}