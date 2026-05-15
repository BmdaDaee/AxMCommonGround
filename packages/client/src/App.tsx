import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import superjson from 'superjson';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InvitePage from './pages/InvitePage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';
import BentlyPage from './pages/BentlyPage';
import XpPage from './pages/XpPage';
import MissionsPage from './pages/MissionsPage';
import JournalPage from './pages/JournalPage';
import DeeplyUsPage from './pages/DeeplyUsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/trpc`,
          headers() {
            const token = localStorage.getItem('token');
            return {
              Authorization: token ? `Bearer ${token}` : undefined,
            };
          },
          transformer: superjson as any,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Pair formation — no layout chrome */}
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/join" element={<JoinPage />} />

            {/* Main app */}
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
