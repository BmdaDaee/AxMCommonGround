import React, { useState } from 'react';

export const BentlyPage: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([
    {
      role: 'assistant',
      content: "Hey there. I'm Bently. I'm here to help you navigate this relational space with clarity and care. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');

    // Simulate response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I hear you. That sounds significant. Tell me more about how that's been sitting with you.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="p-lg h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">Bently AI</h2>
        <p className="text-text-secondary">Dual-current guidance for relational clarity.</p>
      </div>

      <div className="card-elevated flex-1 flex flex-col overflow-hidden">
        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-lg space-y-lg">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-lg p-md rounded-lg border ${
                  msg.role === 'user'
                    ? 'bg-primary text-bg-base border-primary'
                    : 'bg-bg-hover border-border text-text-primary'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-lg">
          <div className="flex gap-md">
            <input
              type="text"
              placeholder="What's on your mind?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <button onClick={handleSend} className="btn-accent px-lg">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentlyPage;
