import { useState } from 'react';

const ENDPOINTS = [
  {
    category: 'Sessions',
    items: [
      { method: 'POST', path: '/api/sessions', desc: 'Create a new WhatsApp session', body: '{ "sessionId": "string" }' },
      { method: 'GET', path: '/api/sessions', desc: 'List all sessions' },
      { method: 'GET', path: '/api/sessions/:id', desc: 'Get session status' },
      { method: 'GET', path: '/api/sessions/:id/qr', desc: 'Get QR code for pairing' },
      { method: 'DELETE', path: '/api/sessions/:id', desc: 'Destroy session' },
      { method: 'POST', path: '/api/sessions/:id/logout', desc: 'Logout session' },
    ],
  },
  {
    category: 'Messages',
    items: [
      { method: 'POST', path: '/api/sessions/:id/messages/text', desc: 'Send text message', body: '{ "chatId": "string", "text": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/messages/reply', desc: 'Reply to message', body: '{ "chatId": "string", "text": "string", "messageId": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/messages/react', desc: 'React to message', body: '{ "chatId": "string", "messageId": "string", "reaction": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/messages/poll', desc: 'Send poll', body: '{ "chatId": "string", "title": "string", "options": ["string"] }' },
      { method: 'POST', path: '/api/sessions/:id/messages/location', desc: 'Send location', body: '{ "chatId": "string", "latitude": number, "longitude": number }' },
    ],
  },
  {
    category: 'Chats',
    items: [
      { method: 'GET', path: '/api/sessions/:id/chats', desc: 'List all chats' },
      { method: 'GET', path: '/api/sessions/:id/chats/:chatId', desc: 'Get chat info' },
      { method: 'GET', path: '/api/sessions/:id/chats/:chatId/messages', desc: 'Get chat messages', params: '?limit=50' },
      { method: 'POST', path: '/api/sessions/:id/chats/:chatId/archive', desc: 'Archive/unarchive chat', body: '{ "archive": boolean }' },
      { method: 'POST', path: '/api/sessions/:id/chats/:chatId/pin', desc: 'Pin/unpin chat', body: '{ "pin": boolean }' },
      { method: 'POST', path: '/api/sessions/:id/chats/:chatId/mute', desc: 'Mute/unmute chat', body: '{ "mute": boolean, "duration": number }' },
    ],
  },
  {
    category: 'Groups',
    items: [
      { method: 'GET', path: '/api/sessions/:id/groups', desc: 'List groups' },
      { method: 'POST', path: '/api/sessions/:id/groups', desc: 'Create group', body: '{ "name": "string", "participants": ["string"] }' },
      { method: 'GET', path: '/api/sessions/:id/groups/:groupId', desc: 'Get group info' },
      { method: 'PUT', path: '/api/sessions/:id/groups/:groupId', desc: 'Update group', body: '{ "name": "string", "description": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/groups/:groupId/participants/add', desc: 'Add participants', body: '{ "participants": ["string"] }' },
      { method: 'POST', path: '/api/sessions/:id/groups/:groupId/participants/remove', desc: 'Remove participants', body: '{ "participants": ["string"] }' },
    ],
  },
  {
    category: 'Media',
    items: [
      { method: 'POST', path: '/api/sessions/:id/media/send', desc: 'Send media (file upload)', body: 'multipart/form-data: file, chatId, caption' },
      { method: 'POST', path: '/api/sessions/:id/media/url', desc: 'Send media from URL', body: '{ "chatId": "string", "url": "string", "caption": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/media/base64', desc: 'Send base64 media', body: '{ "chatId": "string", "base64": "string", "mimetype": "string" }' },
      { method: 'GET', path: '/api/sessions/:id/media/:messageId', desc: 'Download media from message' },
    ],
  },
  {
    category: 'Status',
    items: [
      { method: 'POST', path: '/api/sessions/:id/status/text', desc: 'Post text status', body: '{ "text": "string", "backgroundColor": "string" }' },
      { method: 'POST', path: '/api/sessions/:id/status/media', desc: 'Post media status', body: '{ "url": "string", "caption": "string" }' },
    ],
  },
  {
    category: 'Webhooks',
    items: [
      { method: 'GET', path: '/api/sessions/:id/webhooks', desc: 'Get webhook' },
      { method: 'POST', path: '/api/sessions/:id/webhooks', desc: 'Register webhook', body: '{ "url": "string", "events": ["string"] }' },
      { method: 'DELETE', path: '/api/sessions/:id/webhooks', desc: 'Remove webhook' },
    ],
  },
];

const COLORS = {
  GET: 'bg-green-900/50 text-green-400',
  POST: 'bg-blue-900/50 text-blue-400',
  PUT: 'bg-yellow-900/50 text-yellow-400',
  DELETE: 'bg-red-900/50 text-red-400',
};

export default function Docs() {
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">API Documentation</h2>
        <p className="text-gray-400 text-sm mt-1">Complete reference for the WhatsApp HTTP API</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-2">Authentication</h3>
        <p className="text-sm text-gray-400">All requests require the <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">X-API-Key</code> header.</p>
        <pre className="mt-3 bg-gray-950 p-3 rounded text-xs text-gray-300">{`X-API-Key: your-secret-api-key`}</pre>
      </div>

      {ENDPOINTS.map(({ category, items }) => (
        <div key={category} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(category)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition"
          >
            <span className="text-white font-semibold">{category}</span>
            <span className="text-gray-500">{items.length} endpoints</span>
          </button>

          {expanded[category] && (
            <div className="divide-y divide-gray-800">
              {items.map(({ method, path, desc, body, params }) => (
                <div key={path} className="p-4 hover:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${COLORS[method]}`}>{method}</span>
                    <div className="flex-1">
                      <code className="text-gray-300 font-mono text-sm">{path}</code>
                      <p className="text-gray-400 text-sm mt-1">{desc}</p>
                      {params && <p className="text-xs text-gray-500 mt-1">Params: {params}</p>}
                      {body && (
                        <pre className="mt-2 bg-gray-950 p-2 rounded text-xs text-gray-400">{body}</pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="text-center text-gray-500 text-sm pt-4">
        WhatsApp HTTP API v1.0 · SirClaw
      </div>
    </div>
  );
}
