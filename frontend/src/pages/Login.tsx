import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/30 text-white mb-2">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100">Welcome Back</h1>
          <p className="text-sm text-slate-400">Sign in to access your TeamFlow collaboration workspace</p>
        </div>

        {/* Quick Demo Login Preset Buttons for Interview Demonstration */}
        <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/20 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>INTERVIEW QUICK DEMO PRESETS</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleQuickLogin('admin@teamflow.dev')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 border border-slate-700/80 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin('rahul@teamflow.dev')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 border border-slate-700/80 transition-colors"
            >
              Rahul
            </button>
            <button
              onClick={() => handleQuickLogin('priya@teamflow.dev')}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-300 border border-slate-700/80 transition-colors"
            >
              Priya
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@teamflow.dev"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
