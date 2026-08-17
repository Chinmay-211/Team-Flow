import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, Activity, Zap, Loader2, ArrowRight, PlusCircle } from 'lucide-react';
import api from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const { summary, recentProjects, recentActivities, myRecentTasks, _cached } = data || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Redis Cache Status Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Overview Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time collaboration metrics and cached activity</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              _cached
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {_cached ? 'Redis Cache: HIT (60s TTL)' : 'Redis Cache: MISS (Fresh Query)'}
          </span>

          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{summary?.totalProjects || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Assigned Tasks</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{summary?.myTasks || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{summary?.completedTasks || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-100">{summary?.pendingTasks || 0}</p>
        </div>
      </div>

      {/* Main Grid: Projects & My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-200 text-lg">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 glass-card rounded-2xl">No projects created yet.</div>
            ) : (
              recentProjects?.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-card p-5 rounded-2xl border border-slate-800/80 cursor-pointer flex items-center justify-between hover:border-indigo-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-100 text-base">{project.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{project.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                      {project._count?.members || 1} Members
                    </span>
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-mono">
                      {project._count?.tasks || 0} Tasks
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-200 text-lg">Recent Activity</h2>
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4 max-h-[420px] overflow-y-auto">
            {recentActivities?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivities?.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                  <img
                    src={act.user?.avatarUrl || 'https://ui-avatars.com/api/?name=User'}
                    alt={act.user?.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/30 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium">
                      <span className="text-indigo-400 font-semibold">{act.user?.name}</span> {act.action.toLowerCase().replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-500">{new Date(act.createdAt).toLocaleTimeString()} • {act.project?.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
