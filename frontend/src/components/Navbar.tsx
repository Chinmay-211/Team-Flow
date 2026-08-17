import React, { useState, useEffect } from 'react';
import { Search, Bell, X, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore initial load err
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setSearchResults(res.data.data.results || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, projects, comments (OpenSearch & Redis)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 absolute right-3 text-indigo-400 animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50">
            <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-400 flex justify-between">
              <span>SEARCH RESULTS</span>
              <span className="text-indigo-400 font-mono">{searchResults.length} FOUND</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No matching content found</div>
            ) : (
              searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setShowSearchResults(false);
                    setQuery('');
                    if (item.type === 'project') navigate(`/projects/${item.projectId}`);
                    else if (item.type === 'task') navigate(`/projects/${item.projectId}?task=${item.id}`);
                    else navigate(`/projects/${item.projectId}`);
                  }}
                  className="p-3 border-b border-slate-800/50 hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.type === 'project'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : item.type === 'task'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{item.projectName}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-200 truncate">{item.title}</h4>
                  {item.description && <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>}
                  {item.content && <p className="text-xs text-slate-400 line-clamp-1">{item.content}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
