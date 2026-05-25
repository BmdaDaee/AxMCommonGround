import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

const authBackdrop = 'https://static.prod-images.emergentagent.com/jobs/0c4a90ec-1e65-497e-9609-b972b267c41b/images/7a163b9b91ee484425f171196294773f662f29087864dc2e7057a0be48060565.png';
const authPanelMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function AuthPage({ mode, authState }) {
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const mutation = useMutation({
    mutationFn: (payload) => api(isSignup ? '/auth/signup' : '/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data) => {
      authState.onAuthSuccess(data);
      toast.success(isSignup ? 'Your space is ready.' : 'Welcome back.');
      navigate('/dashboard');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="auth-layout">
      <motion.section className="auth-panel" {...authPanelMotion}>
        <div className="page-stack">
          <p className="eyebrow" data-testid="auth-page-eyebrow">Installable PWA · native-feeling flow</p>
          <div className="auth-copy">
            <h2 data-testid="auth-page-title">{isSignup ? 'Build the shared space before the conversation starts.' : 'Come back to the middle with clarity.'}</h2>
          </div>
          <p className="page-subtitle" data-testid="auth-page-subtitle">
            CommonGround is where invites, messaging, reflection, and Bently all live together in one warm, private space.
          </p>
        </div>

        <form
          className="auth-panel"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(isSignup ? form : { email: form.email, password: form.password });
          }}
          data-testid="auth-form"
        >
          {isSignup && (
            <div className="form-grid">
              <label htmlFor="name" className="eyebrow">Your name</label>
              <input id="name" className="field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} data-testid="signup-name-input" placeholder="A name your partner would know" required />
            </div>
          )}

          <div className="form-grid">
            <label htmlFor="email" className="eyebrow">Email</label>
            <input id="email" type="email" className="field" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} data-testid="auth-email-input" placeholder="you@example.com" required />
          </div>

          <div className="form-grid">
            <label htmlFor="password" className="eyebrow">Password</label>
            <input id="password" type="password" className="field" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} data-testid="auth-password-input" placeholder="At least 8 characters" required minLength={8} />
          </div>

          <button type="submit" className="button button-primary full" data-testid="auth-submit-button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Holding your place…' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="muted-copy" data-testid="auth-switch-copy">
            {isSignup ? 'Already inside?' : 'New to CommonGround?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} className="link-accent" data-testid="auth-switch-link">
              {isSignup ? 'Sign in here' : 'Create your account'}
            </Link>
          </p>
        </form>
      </motion.section>

      <section className="auth-image" style={{ backgroundImage: `url(${authBackdrop})` }} data-testid="auth-hero-image">
        <div className="hero-image-copy">
          <p className="eyebrow">For web, PWA, and mobile</p>
          <h3 data-testid="auth-hero-title">A premium couple space that feels quiet, intentional, and safe.</h3>
          <p data-testid="auth-hero-copy">Invite your partner, share messages, read the relationship weather, and let Bently hold the middle without taking sides.</p>
        </div>
      </section>
    </div>
  );
}