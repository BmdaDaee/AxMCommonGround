import React, { useState } from 'react';

export const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const events: Record<number, string[]> = {
    14: ['Check-in'],
    18: ['Anniversary'],
    25: ['Mission: Resolve conflict'],
  };

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-lg space-y-lg">
      <div className="mb-lg flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-sm">Calendar</h2>
          <p className="text-text-secondary">Shared events and important dates.</p>
        </div>
        <button className="btn-primary">Add Event</button>
      </div>

      {/* Calendar */}
      <div className="card-elevated">
        {/* Month header */}
        <div className="flex items-center justify-between mb-lg border-b border-border pb-lg">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="btn-ghost"
          >
            ← Prev
          </button>
          <h3 className="font-bold text-primary">{monthName}</h3>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="btn-ghost"
          >
            Next →
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-sm mb-sm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-text-tertiary">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-sm">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`aspect-square p-md rounded-lg border flex flex-col items-start justify-start ${
                day
                  ? 'bg-bg-hover border-border hover:border-primary cursor-pointer'
                  : 'bg-transparent border-transparent'
              }`}
            >
              {day && (
                <>
                  <span className="text-sm font-semibold text-text-primary">{day}</span>
                  {events[day] && (
                    <div className="mt-xs space-y-xs w-full">
                      {events[day].map((event, eidx) => (
                        <p
                          key={eidx}
                          className="text-xs bg-primary/20 text-primary px-xs py-xs rounded truncate"
                        >
                          {event}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="section-divider">
        <h3 className="font-semibold text-accent mb-lg">Upcoming Events</h3>
        <div className="space-y-md">
          {[
            {
              date: 'May 18',
              title: 'Anniversary',
              description: 'Celebrate our milestone',
              type: 'milestone',
            },
            {
              date: 'May 25',
              title: 'Mission: Resolve conflict',
              description: 'Work toward resolution',
              type: 'mission',
            },
            {
              date: 'June 1',
              title: 'Quarterly check-in',
              description: 'Reflect on progress',
              type: 'checkin',
            },
          ].map((event, idx) => (
            <div key={idx} className="card hover-bg-surface">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-text-primary">{event.title}</p>
                  <p className="text-sm text-text-secondary mt-sm">{event.description}</p>
                </div>
                <span className="badge badge-primary text-xs">{event.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
