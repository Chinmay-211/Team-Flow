import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, CheckCircle2, UserCheck, Paperclip } from 'lucide-react';
import api from '../services/api';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserCheck className="w-5 h-5 text-indigo-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-5 h-5 text-cyan-400" />;
      case 'TASK_COMPLETED':
      case 'TASK_STATUS_CHANGED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'ATTACHMENT_UPLOADED':
        return <Paperclip className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs font-mono font-bold bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400">Triggered by SNS → SQS → Background Worker Pipeline</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-800 space-y-3">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No Notifications</h3>
          <p className="text-xs text-slate-500">You're all caught up! As task assignments and updates occur via SNS/SQS, notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                notif.isRead
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-900/90 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 mt-0.5">
                  {getEventIcon(notif.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-slate-100">{notif.title}</h4>
                    {!notif.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />}
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{notif.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
