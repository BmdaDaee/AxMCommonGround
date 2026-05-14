import React from 'react';

export const XpPage: React.FC = () => {
  const currentXp = 3250;
  const nextLevelXp = 5000;
  const level = 8;
  const rank = 'Sentinel';

  const xpPercentage = (currentXp / nextLevelXp) * 100;

  return (
    <div className="p-lg space-y-lg">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">XP & Rank</h2>
        <p className="text-text-secondary">Track your relational growth and progression.</p>
      </div>

      {/* Current level card */}
      <div className="card-elevated border-2 border-primary p-2xl">
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-md">Level {level}</h3>
            <p className="text-3xl font-bold text-primary mb-sm">{rank}</p>
            <p className="text-text-secondary text-sm">High mastery in relational communication</p>
          </div>
          <div className="text-6xl">⚡</div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between items-center mb-sm">
            <span className="text-text-secondary text-sm">Progress to Level {level + 1}</span>
            <span className="text-primary font-bold text-sm">
              {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <div className="w-full h-3 bg-bg-hover rounded-full border border-border overflow-hidden">
            <div
              className="h-full bg-gradient-gold transition-all duration-base"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-sm">{xpPercentage.toFixed(0)}% complete</p>
        </div>
      </div>

      {/* Rank progression */}
      <div className="card">
        <h3 className="font-semibold text-primary mb-lg">Rank Progression</h3>
        <div className="space-y-md">
          {[
            { level: 5, rank: 'Advocate', xp: 1000, current: false },
            { level: 6, rank: 'Navigator', xp: 2000, current: false },
            { level: 7, rank: 'Keeper', xp: 3000, current: false },
            { level: 8, rank: 'Sentinel', xp: 4000, current: true },
            { level: 9, rank: 'Sovereign', xp: 5000, current: false },
          ].map((row) => (
            <div
              key={row.level}
              className={`p-md rounded-lg border ${
                row.current ? 'bg-primary/10 border-primary' : 'bg-bg-hover border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className={`text-lg ${row.current ? 'text-primary' : 'text-text-tertiary'}`}>
                    ◆
                  </span>
                  <div>
                    <p className={`font-medium ${row.current ? 'text-primary' : 'text-text-primary'}`}>
                      Level {row.level}: {row.rank}
                    </p>
                    <p className="text-xs text-text-tertiary">{row.xp.toLocaleString()} XP</p>
                  </div>
                </div>
                {row.current && <span className="text-accent font-bold text-sm">CURRENT</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP sources */}
      <div className="card">
        <h3 className="font-semibold text-accent mb-lg">Recent XP Gains</h3>
        <div className="space-y-sm">
          {[
            { action: 'Completed: "Have a difficult conversation"', xp: 50 },
            { action: 'Checked in with your partner', xp: 25 },
            { action: 'Completed daily mission', xp: 30 },
            { action: 'Journal entry written', xp: 15 },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-md bg-bg-hover rounded-lg">
              <p className="text-sm text-text-primary">{item.action}</p>
              <span className="font-bold text-accent">+{item.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XpPage;
