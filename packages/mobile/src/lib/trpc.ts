import { useMutation, useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function request(path: string, options: RequestInit = {}) {
  if (!API_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_URL');
  }

  const token = await SecureStore.getItemAsync('authToken');
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  return data;
}

export const trpc = {
  auth: {
    login: {
      useMutation: () => useMutation({ mutationFn: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }) }),
    },
    signup: {
      useMutation: () => useMutation({ mutationFn: (payload: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ ...payload, name: payload.name || payload.email.split('@')[0] }) }) }),
    },
  },
  pairs: {
    createInvite: {
      useMutation: () => useMutation({ mutationFn: async () => {
        const data = await request('/pairs/invite', { method: 'POST' });
        return { inviteCode: data.code, ...data };
      } }),
    },
    acceptInvite: {
      useMutation: () => useMutation({ mutationFn: (payload: any) => request('/pairs/join', { method: 'POST', body: JSON.stringify({ code: payload.inviteCode || payload.code }) }) }),
    },
    getMyPair: {
      useQuery: (_input?: any) => useQuery({ queryKey: ['mobile-pair'], queryFn: async () => {
        const data = await request('/pairs/me');
        return data.pair;
      } }),
    },
  },
  messages: {
    getMessages: {
      useQuery: (_input?: any) => useQuery({ queryKey: ['mobile-messages'], queryFn: async () => {
        const data = await request('/messages');
        return (data.items || []).map((item: any) => ({ ...item, senderId: item.userId, senderName: item.userName }));
      } }),
    },
    sendMessage: {
      useMutation: () => useMutation({ mutationFn: (payload: any) => request('/messages', { method: 'POST', body: JSON.stringify({ content: payload.content }) }) }),
    },
  },
  bently: {
    coachSolo: {
      useMutation: () => useMutation({ mutationFn: (payload: any) => request('/bently', { method: 'POST', body: JSON.stringify({ message: payload.message }) }) }),
    },
  },
};
