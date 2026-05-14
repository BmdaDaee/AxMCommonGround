import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl mb-8 text-center text-[#D4AF37]">Sovereign Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase mb-2 text-[#B0B0B0]">Email</label>
            <input 
              type="email" 
              className="input w-full" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-2 text-[#B0B0B0]">Password</label>
            <input 
              type="password" 
              className="input w-full" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full py-3"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Enter Vault'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#B0B0B0]">
          New to CommonGround? <Link to="/signup" className="text-[#9D4EDD] hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
