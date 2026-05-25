const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_BACKEND_URL || '/api').replace(/\/$/, '');

export const session = {
  getToken: () => localStorage.getItem('cg-token') || '',
  getUser: () => {
    const raw = localStorage.getItem('cg-user');
    return raw ? JSON.parse(raw) : null;
  },
  set(data) {
    localStorage.setItem('cg-token', data.token);
    localStorage.setItem('cg-user', JSON.stringify(data.user));
  },
  clear() {
    localStorage.removeItem('cg-token');
    localStorage.removeItem('cg-user');
  },
};

export async function api(path, options = {}) {
  const token = session.getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Something went wrong');
  }
  return data;
}