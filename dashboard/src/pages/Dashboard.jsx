import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { sessionsApi, chatsApi } from '../api';
import { Radio, MessageSquare, Users, User, Zap, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { sessions, activeSession, fetchSessions } = useApp();
  const [stats, setStats] = useState({ chats: 0, groups: 0, contacts: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    setLoading(true);
    Promise.all([
      chatsApi.list(activeSession).catch(() => ({ data: { chats: [] } })),
    ]).then(([chatsRes]) => {
      const chats = chatsRes.data.chats || [];
      setStats({
        chats: chats.length,
        groups: chats.filter((c) => c.isGroup).length,
        contacts: chats.filter((c) => !c.isGroup).length,
      });
      setRecent(chats.slice(0, 5));
      setLoading(false);
    });
  }, [activeSession, sessions]);

  const readySessions = sessions.filter((s) => s.ready).length;
  const activeSess = sessions.find((s) => s.id === activeSession);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">Overview of your WhatsApp API</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Radio} label="Total Sessions" value={sessions.length} color="bg-blue-900/50 text-blue-400" sub={`${readySessions} connected`} />
        <StatCard icon={MessageSquare} label="Chats" value={stats.chats} color="bg-green-900/50 text-green-400" />
        <StatCard icon={Users} label="Groups" value={stats.groups} color="bg-purple-900/50 text-purple-400" />
        <StatCard icon={User} label="Contacts" value={stats.contacts} color="bg-orange-900/50 text-orange-400" />
      </div>

      {/* Active session */}
      {activeSess ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Active Session</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${activeSess.ready ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
              {activeSess.ready ? '● Connected' : '○ Connecting'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">ID:</span> <span className="text-white ml-2">{activeSess.id}</span></div>
            {activeSess.phone && <div><span className="text-gray-400">Phone:</span> <span className="text-white ml-2">{activeSess.phone}</span></div>}
            {activeSess.name && <div><span className="text-gray-400">Name:</span> <span className="text-white ml-2">{activeSess.name}</span></div>}
            {activeSess.status && <div><span className="text-gray-400">Status:</span> <span className="text-white ml-2">{activeSess.status}</span></div>}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Radio size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No active session</p>
          <p className="text-gray-500 text-xs mt-1">Go to Sessions to create or connect one</p>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Chats</h3>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="text-gray-500 text-sm">No chats yet</p>
          ) : (
            <div className="space-y-2">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-300">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{c.name || c.id}</p>
                    <p className="text-xs text-gray-500">{c.isGroup ? 'Group' : 'Chat'}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{c.unreadCount}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">API Endpoints</h3>
          <div className="space-y-2 text-sm">
            {[
              { method: 'POST', path: '/api/sessions', desc: 'Create session' },
              { method: 'GET', path: '/api/sessions', desc: 'List sessions' },
              { method: 'POST', path: '/api/:id/messages/text', desc: 'Send text' },
              { method: 'GET', path: '/api/:id/chats', desc: 'List chats' },
              { method: 'POST', path: '/api/:id/webhooks', desc: 'Register webhook' },
            ].map(({ method, path, desc }) => (
              <div key={path} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${method === 'GET' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>{method}</span>
                <span className="text-gray-300 font-mono text-xs">{path}</span>
                <span className="text-gray-500 text-xs ml-auto">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
