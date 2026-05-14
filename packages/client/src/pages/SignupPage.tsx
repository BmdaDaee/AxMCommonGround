import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // TODO: Call tRPC signup mutation
      if (formData.email && formData.password && formData.name) {
        localStorage.setItem('authToken', 'mock_token_' + Date.now());
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
          <h1 className="text-3xl font-bold text-primary mb-sm">Join CommonGround</h1>
          <p className="text-text-secondary">Start your relational journey.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-lg card-elevated">
          {error && (
            <div className="p-md bg-highlight/10 border border-highlight rounded-md">
              <p className="text-sm text-highlight">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-sm">
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary mb-sm"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-text-secondary text-sm mt-lg">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-light font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
