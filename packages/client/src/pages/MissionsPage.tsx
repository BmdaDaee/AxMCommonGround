import React, { useState } from 'react';

interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  completed: boolean;
  dueDate: string;
}

export const MissionsPage: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: '1',
      title: 'Have a difficult conversation',
      description: "Discuss something that's been on your mind with your partner.",
      difficulty: 'medium',
      xpReward: 50,
      completed: false,
      dueDate: '2025-05-20',
    },
    {
      id: '2',
      title: 'Daily check-in',
      description: 'Spend 10 minutes asking how your partner is doing.',
      difficulty: 'easy',
      xpReward: 25,
      completed: true,
      dueDate: '2025-05-14',
    },
    {
      id: '3',
      title: 'Resolve a past conflict',
      description: 'Pick an unresolved issue and work toward resolution.',
      difficulty: 'hard',
      xpReward: 100,
      completed: false,
      dueDate: '2025-05-25',
    },
  ]);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-status-aligned text-bg-base',
      medium: 'bg-status-stress text-bg-base',
      hard: 'bg-status-tension text-bg-base',
    };
    return colors[difficulty] || 'bg-border text-text-primary';
  };

  return (
    <div className="p-lg space-y-lg">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">Missions</h2>
        <p className="text-text-secondary">
          Complete missions to strengthen your relational bond and earn XP.
        </p>
      </div>

      {/* Mission stats */}
      <div className="grid grid-cols-3 gap-lg">
        <div className="card">
          <h4 className="text-xs text-text-secondary font-semibold mb-sm">Total Missions</h4>
          <p className="text-3xl font-bold text-primary">{missions.length}</p>
        </div>
        <div className="card">
          <h4 className="text-xs text-text-secondary font-semibold mb-sm">Completed</h4>
          <p className="text-3xl font-bold text-status-aligned">
            {missions.filter((m) => m.completed).length}
          </p>
        </div>
        <div className="card">
          <h4 className="text-xs text-text-secondary font-semibold mb-sm">XP Pending</h4>
          <p className="text-3xl font-bold text-highlight">
            {missions.filter((m) => !m.completed).reduce((sum, m) => sum + m.xpReward, 0)}
          </p>
        </div>
      </div>

      {/* Missions list */}
      <div className="space-y-md">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`card hover-bg-surface cursor-pointer transition-all ${
              mission.completed ? 'opacity-60' : ''
            }`}
            onClick={() => toggleMission(mission.id)}
          >
            <div className="flex items-start gap-lg">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={mission.completed}
                onChange={() => toggleMission(mission.id)}
                className="mt-2 w-5 h-5 cursor-pointer"
              />

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-md">
                  <div>
                    <h3
                      className={`font-semibold ${
                        mission.completed ? 'text-text-tertiary line-through' : 'text-text-primary'
                      }`}
                    >
                      {mission.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-sm">{mission.description}</p>
                  </div>

                  {/* XP reward */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">+{mission.xpReward} XP</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-md">
                  <span className={`badge ${getDifficultyColor(mission.difficulty)}`}>
                    {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    Due: {new Date(mission.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionsPage;
