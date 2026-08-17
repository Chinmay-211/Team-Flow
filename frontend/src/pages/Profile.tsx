import React from 'react';
import { User, Mail, Calendar, ShieldCheck, Key, Server, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">User Profile</h1>
        <p className="text-sm text-slate-400">Authenticated candidate profile and environment info</p>
      </div>

      {/* User Card */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center gap-6">
        <img
          src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User'}
          alt={user?.name}
          className="w-24 h-24 rounded-full ring-4 ring-indigo-500/30 object-cover shadow-2xl"
        />
        <div className="space-y-2 text-center md:text-left flex-1">
          <h2 className="text-2xl font-extrabold text-slate-100">{user?.name}</h2>
          <p className="text-sm text-indigo-400 font-medium">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> JWT Verified
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-indigo-400" /> Member since 2026
            </span>
          </div>
        </div>
      </div>

      {/* Infrastructure Stack Summary Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          Configured AWS & Platform Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-semibold text-slate-200">Database Layer</span>
            <p className="text-slate-400">PostgreSQL (Prisma ORM) with relational indices</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-semibold text-slate-200">Cache Layer</span>
            <p className="text-slate-400">Redis Server (Dashboard 60s & Search 120s caching)</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-semibold text-slate-200">Storage & Search</span>
            <p className="text-slate-400">Amazon S3 (presigned attachments) & OpenSearch</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-semibold text-slate-200">Async Messaging</span>
            <p className="text-slate-400">Amazon SNS Topic → Amazon SQS Queue Worker</p>
          </div>
        </div>
      </div>
    </div>
  );
};
