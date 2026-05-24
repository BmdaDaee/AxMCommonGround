import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SpinnerGap } from '@phosphor-icons/react';
import AppShell from './components/AppShell';
import { api, session } from './lib/api';
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
  const [token, setToken] = useState(session.getToken());
  const [user, setUser] = useState(session.getUser());

  const meQuery = useQuery({
    queryKey: ['me', token],
    queryFn: () => api('/auth/me'),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      session.clear();
      setToken('');
      setUser(null);
    }
  }, [meQuery.isError]);

  const currentUser = meQuery.data?.user || user;

  const authState = useMemo(
    () => ({
      onAuthSuccess(data) {
        session.set(data);
        setToken(data.token);
        setUser(data.user);
      },
      onLogout() {
        session.clear();
        setToken('');
        setUser(null);
      },
      token,
      user: currentUser,
    }),
    [token, currentUser],
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" authState={authState} />}
      />
      <Route
        path="/signup"
        element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="signup" authState={authState} />}
      />

      <Route
        element={
          <Protected authenticated={Boolean(token)} loading={meQuery.isLoading}>
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

      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}