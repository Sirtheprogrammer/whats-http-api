import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { webhooksApi } from '../api';
import { Webhook, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

const EVENTS = [
  { id: 'message', label: 'Message Received' },
  { id: 'message_create', label: 'Message Sent' },
  { id: 'message_ack', label: 'Message Delivered/Read' },
  { id: 'group_join', label: 'Group Join' },
  { id: 'group_leave', label: 'Group Leave' },
  { id: 'session_ready', label: 'Session Connected' },
  { id: 'session_disconnected', label: 'Session Disconnected' },
];

export default function Webhooks() {
  const { activeSession } = useApp();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['message']);
  const [webhook, setWebhook] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSession) return;
    loadWebhook();
  }, [activeSession]);

  const loadWebhook = async () => {
    if (!activeSession) return;
    try {
      const res = await webhooksApi.get(activeSession);
      setWebhook(res.data.webhook);
    } catch {}
  };

  const register = async () => {
    if (!url.trim() || !activeSession) return;
    setLoading(true);
    try {
      await webhooksApi.register(activeSession, url.trim(), selectedEvents);
      await loadWebhook();
      setUrl('');
    } catch {}
    setLoading(false);
  };

  const remove = async () => {
    if (!activeSession) return;
    await webhooksApi.delete(activeSession);
    setWebhook(null);
  };

  const toggleEvent = (id) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        Select a session first
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Webhooks</h2>
        <p className="text-gray-400 text-sm mt-1">Get real-time events delivered to your endpoint</p>
      </div>

      {webhook ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Webhook size={20} className="text-green-400" />
              <span className="text-white font-medium">Active Webhook</span>
            </div>
            <button onClick={remove} className="p-2 text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">URL</p>
              <p className="text-sm text-gray-300 font-mono">{webhook.url}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Events</p>
              <div className="flex flex-wrap gap-2">
                {webhook.events?.map((e) => (
                  <span key={e} className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-xs">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Register Webhook</h3>

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
          />

          <p className="text-xs text-gray-500 uppercase mb-3">Select Events</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {EVENTS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => toggleEvent(id)}
                className={`flex items-center gap-2 p-3 rounded-lg text-left text-sm transition ${
                  selectedEvents.includes(id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {selectedEvents.includes(id) ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded border border-gray-500" />}
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={register}
            disabled={!url.trim() || selectedEvents.length === 0 || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white"
          >
            <Plus size={16} /> Register Webhook
          </button>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-yellow-400 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p className="text-white font-medium mb-1">Webhook Payload</p>
          <pre className="bg-gray-950 p-3 rounded text-xs overflow-x-auto">{`{
  "event": "message",
  "sessionId": "my-session",
  "data": { ... },
  "timestamp": 1712345678901
}`}</pre>
        </div>
      </div>
    </div>
  );
}
