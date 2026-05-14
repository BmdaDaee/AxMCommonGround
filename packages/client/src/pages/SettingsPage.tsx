import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    emailDigest: true,
    theme: 'dark',
    language: 'en',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-lg space-y-lg max-w-2xl">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold mb-sm">Settings</h2>
        <p className="text-text-secondary">Manage your CommonGround preferences.</p>
      </div>

      {/* Account section */}
      <div className="card-elevated">
        <h3 className="font-semibold text-primary mb-lg border-b border-border pb-lg">
          Account
        </h3>
        <div className="space-y-lg">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-sm">
              Email Address
            </label>
            <input type="email" value="user@example.com" disabled className="w-full opacity-50" />
            <p className="text-xs text-text-tertiary mt-sm">Contact support to change</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-sm">
              Partner Email
            </label>
            <input type="email" value="partner@example.com" disabled className="w-full opacity-50" />
            <p className="text-xs text-text-tertiary mt-sm">Your paired partner account</p>
          </div>

          <div className="section-divider">
            <button className="btn-secondary w-full">Change Password</button>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="card-elevated">
        <h3 className="font-semibold text-primary mb-lg border-b border-border pb-lg">
          Notifications
        </h3>
        <div className="space-y-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Push Notifications</p>
              <p className="text-sm text-text-secondary">Receive in-app alerts</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={() => handleToggle('notificationsEnabled')}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="section-divider">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Email Digest</p>
                <p className="text-sm text-text-secondary">Weekly summary of activities</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailDigest}
                onChange={() => handleToggle('emailDigest')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences section */}
      <div className="card-elevated">
        <h3 className="font-semibold text-primary mb-lg border-b border-border pb-lg">
          Preferences
        </h3>
        <div className="space-y-lg">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-sm">
              Theme
            </label>
            <select value={settings.theme} className="w-full">
              <option value="dark">Dark (Obsidian Sovereign)</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="section-divider">
            <label className="block text-sm font-medium text-text-primary mb-sm">
              Language
            </label>
            <select value={settings.language} className="w-full">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy section */}
      <div className="card-elevated">
        <h3 className="font-semibold text-primary mb-lg border-b border-border pb-lg">
          Privacy & Data
        </h3>
        <div className="space-y-md">
          <p className="text-sm text-text-secondary mb-lg">
            Your data is encrypted end-to-end. We never share your information with third parties.
          </p>
          <button className="btn-secondary w-full">Download My Data</button>
          <button className="btn-secondary w-full">Data Privacy Policy</button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card-elevated border-2 border-highlight/30">
        <h3 className="font-semibold text-highlight mb-lg border-b border-highlight/30 pb-lg">
          Danger Zone
        </h3>
        <div className="space-y-md">
          <button className="btn-secondary w-full text-highlight border-highlight hover:bg-highlight/10">
            Disconnect from Partner
          </button>
          <button className="btn-secondary w-full text-highlight border-highlight hover:bg-highlight/10">
            Delete Account
          </button>
          <p className="text-xs text-text-tertiary mt-md">
            These actions cannot be undone. Proceed with caution.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-md pt-lg">
        <button className="btn-primary flex-1">Save Changes</button>
        <button className="btn-ghost flex-1">Cancel</button>
      </div>
    </div>
  );
};

export default SettingsPage;
