import { useState, useEffect } from 'react';
import { Radio, MessageSquare, Users, User, Plus, Trash2, RefreshCw, Wifi, WifiOff, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sessionsApi, chatsApi } from '../api';
import QrCode from '../components/QrCode';

export default function Sessions() {
  const { sessions, activeSession, setActiveSession, createSession, deleteSession, fetchSessions } = useApp();
  const [newId, setNewId] = useState('');
  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState({});
  const [stats, setStats] = useState({ chats: 0, contacts: 0, groups: 0 });
  const [creating, setCreating] = useState(false);

  const loadQr = async (sessionId) => {
    setQrLoading(true);
    setSelectedSession(sessionId);
    setActiveSession(sessionId);
    try {
      const res = await sessionsApi.get(sessionId);
      if (res.data.session?.hasQr) {
        const qrRes = await sessionsApi.getQr(sessionId);
        setQr(qrRes.data.qr || null);
      } else {
        setQr(null);
      }
    } catch { setQr(null); }
    setQrLoading(false);
  };

  // Poll QR code
  useEffect(() => {
    if (!selectedSession) return;
    const poll = async () => {
      try {
        const res = await sessionsApi.get(selectedSession);
        if (res.data.session?.hasQr) {
          const qrRes = await sessionsApi.getQr(selectedSession);
          if (qrRes.data?.qr) setQr(qrRes.data.qr);
        } else if (res.data.session?.ready) {
          setQr(null);
        }
      } catch {}
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  // Load stats for active session
  useEffect(() => {
    if (!activeSession) return;
    const load = async () => {
      try {
        const [chatsRes] = await Promise.all([chatsApi.list(activeSession)]);
        const chats = chatsRes.data.chats || [];
        setStats({
          chats: chats.length,
          contacts: chats.filter((c) => !c.isGroup).length,
          groups: chats.filter((c) => c.isGroup).length,
        });
      } catch {}
    };
    load();
  }, [activeSession, sessions]);

  const handleCreate = async () => {
    if (!newId.trim()) return;
    setCreating(true);
    await createSession(newId.trim());
    setNewId('');
    await loadQr(newId.trim());
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete session "${id}"?`)) return;
    await deleteSession(id);
    if (selectedSession === id) { setSelectedSession(null); setQr(null); }
  };

  const activeSessData = sessions.find((s) => s.id === activeSession);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sessions</h2>
          <p className="text-gray-400 text-sm mt-1">Manage WhatsApp device connections</p>
        </div>
        <button onClick={fetchSessions} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: session list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create new */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">New Session</h3>
            <div className="flex gap-2">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="session-id"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newId.trim()}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm text-white transition"
              >
                {creating ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
            </div>
          </div>

          {/* Sessions list */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
            {sessions.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">No sessions yet</div>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`p-4 cursor-pointer hover:bg-gray-800 transition ${selectedSession === s.id ? 'bg-gray-800' : ''}`}
                onClick={() => loadQr(s.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">{s.id}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {s.ready ? (
                        <><Wifi size={11} className="text-green-400" /><span className="text-xs text-green-400">Connected</span></>
                      ) : (
                        <><WifiOff size={11} className="text-yellow-400" /><span className="text-xs text-yellow-400">Connecting</span></>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: QR + info */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedSession}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeSessData?.ready ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className={`text-sm ${activeSessData?.ready ? 'text-green-400' : 'text-yellow-400'}`}>
                      {activeSessData?.ready ? 'Connected' : 'Awaiting scan...'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => loadQr(selectedSession)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition"
                >
                  <RefreshCw size={14} /> Refresh QR
                </button>
              </div>

              {qrLoading ? (
                <div className="flex items-center justify-center h-72">
                  <Loader size={32} className="animate-spin text-blue-500" />
                </div>
              ) : qr ? (
                <div className="flex flex-col items-center">
                  <QrCode value={qr} size={280} sessionId={selectedSession} />
                  <p className="mt-4 text-sm text-gray-400 text-center">
                    Open WhatsApp → Linked Devices → Link a Device
                  </p>
                </div>
              ) : activeSessData?.ready ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi size={28} className="text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Device Connected</h4>
                  <p className="text-gray-400 text-sm mt-1">Ready to send and receive messages</p>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <MessageSquare size={20} className="text-blue-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-white">{stats.chats}</p>
                      <p className="text-xs text-gray-400">Chats</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <User size={20} className="text-green-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-white">{stats.contacts}</p>
                      <p className="text-xs text-gray-400">Contacts</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <Users size={20} className="text-purple-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-white">{stats.groups}</p>
                      <p className="text-xs text-gray-400">Groups</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <RefreshCw size={32} className="text-gray-600 mb-3 animate-spin" style={{ animationDuration: '3s' }} />
                  <p className="text-gray-400 text-sm">Waiting for QR code...</p>
                  <p className="text-gray-500 text-xs mt-1">Make sure to create the session first</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col items-center justify-center h-96 text-center">
              <Radio size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400">Select a session to view QR code</p>
              <p className="text-gray-500 text-xs mt-1">Or create a new one from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
