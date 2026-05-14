import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, queryClient } from './lib/trpc';
import App from './App';
import './styles/globals.css';

// Initialize tRPC client
const trpcClient = trpc.createClient({
  links: [
    trpc.httpBatchLink({
      url: `${import.meta.env.VITE_TRPC_URL || 'http://localhost:3000'}/trpc`,
      credentials: 'include',
    }),
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </trpc.Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
