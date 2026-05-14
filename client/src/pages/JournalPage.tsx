import React, { useState } from 'react';

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '2025-05-14',
      title: 'Reflection on our conversation',
      content: 'Today we talked about our future plans. It felt vulnerable but necessary.',
      sentiment: 'hopeful',
    },
    {
      id: 2,
      date: '2025-05-13',
      content: 'Feeling stuck on something I said yesterday. Need to address it.',
      sentiment: 'anxious',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  const sentimentColors: Record<string, string> = {
    hopeful: 'text-status-aligned',
    anxious: 'text-status-stress',
    grateful: 'text-accent',
    neutral: 'text-text-tertiary',
    tense: 'text-status-tension',
  };

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      setEntries((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          title: '',
          content: newEntry,
          sentiment: 'neutral',
        },
        ...prev,
      ]);
      setNewEntry('');
      setShowForm(false);
    }
  };

  return (
    <div className="p-lg space-y-lg">
      <div className="mb-lg flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-sm">Journal</h2>
          <p className="text-text-secondary">Private reflections on your relationship.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Entry'}
        </button>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="card-elevated">
          <textarea
            placeholder="What's on your mind? Reflect freely..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            className="w-full h-32 mb-lg"
          />
          <div className="flex gap-md">
            <button className="btn-primary" onClick={handleAddEntry}>
              Save Entry
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-lg">
        {entries.map((entry) => (
          <div key={entry.id} className="card hover:border-primary transition-all">
            <div className="flex justify-between items-start mb-md">
              <div>
                {entry.title && (
                  <h3 className="font-semibold text-text-primary mb-sm">{entry.title}</h3>
                )}
                <p className="text-xs text-text-tertiary">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {entry.sentiment && (
                <span className={`text-sm font-medium ${sentimentColors[entry.sentiment]}`}>
                  {entry.sentiment}
                </span>
              )}
            </div>
            <p className="text-text-primary leading-relaxed">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalPage;
