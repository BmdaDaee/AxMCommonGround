import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import page components
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import BentlyPage from './pages/BentlyPage';
import XpPage from './pages/XpPage';
import MissionsPage from './pages/MissionsPage';
import JournalPage from './pages/JournalPage';
import DeeplyUsPage from './pages/DeeplyUsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const isAuthenticated = !!localStorage.getItem('authToken');

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />}
      />

      {/* Protected Routes */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/bently" element={<BentlyPage />} />
          <Route path="/xp" element={<XpPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/deeplyus" element={<DeeplyUsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}

export default App;
