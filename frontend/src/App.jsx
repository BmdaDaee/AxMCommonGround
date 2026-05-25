import { useCallback, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SpinnerGap } from '@phosphor-icons/react';
import AppShell from './components/AppShell';
import { api } from './lib/api';
import AuthPage from './pages/AuthPage';
import ConnectPage from './pages/ConnectPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import BentlyPage from './pages/BentlyPage';
import JournalPage from './pages/JournalPage';
import MissionsPage from './pages/MissionsPage';
import CalendarPage from './pages/CalendarPage';
import VaultPage from './pages/VaultPage';
import SettingsPage from './pages/SettingsPage';

function Protected({ authenticated, loading, children }) {
  if (loading) {
    return (
      <div className="screen-loader" data-testid="screen-loader">
        <SpinnerGap size={28} className="spin" />
      </div>
    );
  }
  return authenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api('/auth/me'),
    staleTime: 60_000,
    retry: false,
  });

  const currentUser = meQuery.data?.user || null;
  const authenticated = Boolean(currentUser);

  const handleAuthSuccess = useCallback((data) => {
    queryClient.setQueryData(['me'], { user: data.user });
  }, [queryClient]);

  const handleLogout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      queryClient.setQueryData(['me'], null);
      queryClient.removeQueries({ queryKey: ['notifications-summary'] });
    }
  }, [queryClient]);

  const authState = useMemo(
    () => ({
      onAuthSuccess: handleAuthSuccess,
      onLogout: handleLogout,
      user: currentUser,
    }),
    [currentUser, handleAuthSuccess, handleLogout],
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" authState={authState} />}
      />
      <Route
        path="/signup"
        element={authenticated ? <Navigate to="/dashboard" replace /> : <AuthPage mode="signup" authState={authState} />}
      />

      <Route
        element={
          <Protected authenticated={authenticated} loading={meQuery.isLoading}>
            <AppShell user={currentUser} onLogout={authState.onLogout} />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<DashboardPage user={currentUser} />} />
        <Route path="/invite" element={<ConnectPage mode="invite" />} />
        <Route path="/join" element={<ConnectPage mode="join" />} />
        <Route path="/messages" element={<MessagesPage user={currentUser} />} />
        <Route path="/bently" element={<BentlyPage user={currentUser} />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/settings" element={<SettingsPage authState={authState} />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}