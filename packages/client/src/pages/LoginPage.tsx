import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Call tRPC login mutation
      // const result = await trpc.auth.login.mutate({ email, password });
      // localStorage.setItem('authToken', result.token);
      // navigate('/dashboard');

      // Mock authentication for now
      if (email && password) {
        localStorage.setItem('authToken', 'mock_token_' + Date.now());
        navigate('/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-lg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-3xl">
          <div className="flex justify-center mb-lg">
            <div className="w-16 h-16 bg-gradient-gold flex-center rounded-lg">
              <span className="text-bg-base font-bold text-4xl">⬡</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-sm">CommonGround</h1>
          <p className="text-text-secondary">Relational truth for two.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-lg card-elevated">
          {error && (
            <div className="p-md bg-highlight/10 border border-highlight rounded-md">
              <p className="text-sm text-highlight">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-text-secondary text-sm mt-lg">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary-light font-semibold">
            Sign up
          </Link>
        </p>

        {/* Demo info */}
        <div className="mt-2xl p-lg card border-border-accent">
          <p className="text-xs text-text-secondary mb-md">
            <span className="font-semibold text-accent">Demo credentials:</span>
          </p>
          <code className="text-xs text-text-tertiary block bg-bg-base p-sm rounded border border-border">
            email: demo@example.com
            <br />
            password: demo123
          </code>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
