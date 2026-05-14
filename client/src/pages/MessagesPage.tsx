import React from 'react';

export const MessagesPage: React.FC = () => {
  return (
    <div className="p-lg">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">Messages</h2>
        <p className="text-text-secondary">View and send messages with your partner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg h-[calc(100vh-200px)]">
        {/* Messages list */}
        <div className="card-elevated col-span-1 flex flex-col">
          <h3 className="font-semibold text-primary mb-lg border-b border-border pb-lg">
            Conversations
          </h3>
          <div className="space-y-sm flex-1 overflow-y-auto">
            {[1, 2, 3].map((msg) => (
              <div
                key={msg}
                className="p-md card cursor-pointer hover-bg-surface border-l-2 border-primary"
              >
                <p className="font-medium text-text-primary text-sm">Partner Name</p>
                <p className="text-xs text-text-tertiary truncate">Last message preview...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Message view */}
        <div className="card-elevated col-span-2 flex flex-col">
          <div className="flex-1 overflow-y-auto p-lg space-y-lg">
            <div className="flex justify-start">
              <div className="max-w-xs bg-bg-hover p-md rounded-lg border border-border">
                <p className="text-text-primary text-sm">
                  Hey, how are you feeling about our conversation yesterday?
                </p>
                <p className="text-xs text-text-tertiary mt-sm">2:30 PM</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-xs bg-primary p-md rounded-lg">
                <p className="text-bg-base text-sm">
                  I've been reflecting on it. I think we communicated well, but there are a few
                  things I want to revisit.
                </p>
                <p className="text-xs text-bg-base/60 mt-sm">2:35 PM</p>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-border p-lg">
            <div className="flex gap-md">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1"
              />
              <button className="btn-primary px-lg">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
