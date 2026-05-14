import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with intelligent conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return d.toLocaleDateString();
}

/**
 * Format a date as ISO string without time
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get relational state badge color
 */
export function getStateColor(
  state: 'ALIGNED' | 'STALE' | 'ONE_SIDED_STRESS' | 'TENSION'
): string {
  const colors: Record<string, string> = {
    ALIGNED: 'bg-status-aligned text-bg-base',
    STALE: 'bg-status-stale text-bg-base',
    ONE_SIDED_STRESS: 'bg-status-stress text-bg-base',
    TENSION: 'bg-status-tension text-bg-base',
  };
  return colors[state] || 'bg-border text-text-primary';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/**
 * Debounce function for search, typing, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if user is authenticated (basic check)
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

/**
 * Store auth token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
}
