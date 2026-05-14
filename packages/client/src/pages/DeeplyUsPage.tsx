import React from 'react';

export const DeeplyUsPage: React.FC = () => {
  return (
    <div className="p-lg space-y-lg">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">DeeplyUs Vault</h2>
        <p className="text-text-secondary">Shared memories, milestones, and moments that matter.</p>
      </div>

      {/* Vault categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {[
          {
            title: 'Memories',
            icon: '✦',
            description: 'Photos, videos, and moments',
            count: 24,
          },
          {
            title: 'Milestones',
            icon: '◆',
            description: 'Important dates and anniversaries',
            count: 8,
          },
          {
            title: 'Letters',
            icon: '✉',
            description: 'Handwritten letters and messages',
            count: 5,
          },
          {
            title: 'Goals',
            icon: '→',
            description: 'Shared dreams and aspirations',
            count: 3,
          },
        ].map((category) => (
          <div
            key={category.title}
            className="card-hover cursor-pointer p-lg border-2 border-border hover:border-primary transition-all"
          >
            <div className="flex items-start justify-between mb-md">
              <div>
                <h3 className="font-semibold text-text-primary mb-sm">{category.title}</h3>
                <p className="text-sm text-text-secondary">{category.description}</p>
              </div>
              <span className="text-3xl">{category.icon}</span>
            </div>
            <p className="text-lg font-bold text-primary">{category.count} items</p>
          </div>
        ))}
      </div>

      {/* Recent additions */}
      <div className="section-divider">
        <h3 className="font-semibold text-accent mb-lg">Recent Additions</h3>
        <div className="space-y-md">
          {[
            { item: 'Photo from our trip', date: '2 days ago', category: 'Memories' },
            { item: 'Our anniversary', date: '1 week ago', category: 'Milestones' },
            { item: 'Letter about the future', date: '3 weeks ago', category: 'Letters' },
          ].map((entry, idx) => (
            <div key={idx} className="card hover-bg-surface">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-text-primary">{entry.item}</p>
                  <p className="text-xs text-text-tertiary">{entry.category}</p>
                </div>
                <span className="text-xs text-text-secondary">{entry.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload section */}
      <div className="card-elevated border-2 border-primary/50 text-center p-3xl">
        <p className="text-3xl mb-lg">⬆</p>
        <h3 className="font-semibold text-text-primary mb-sm">Add to Vault</h3>
        <p className="text-text-secondary text-sm mb-lg">
          Upload a memory or milestone to share with your partner.
        </p>
        <button className="btn-primary">Choose File</button>
      </div>
    </div>
  );
};

export default DeeplyUsPage;
