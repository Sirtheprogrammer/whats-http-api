import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { chatsApi, messagesApi } from '../api';
import { MessageSquare, Send, Archive, Pin, BellOff, Trash2, RefreshCw, Search } from 'lucide-react';

export default function Chats() {
  const { activeSession } = useApp();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeSession) return;
    loadChats();
  }, [activeSession]);

  const loadChats = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await chatsApi.list(activeSession);
      setChats(res.data.chats || []);
    } catch {}
    setLoading(false);
  };

  const loadMessages = async (chatId) => {
    if (!activeSession) return;
    setLoading(true);
    setSelectedChat(chatId);
    try {
      const res = await chatsApi.getMessages(activeSession, chatId, 50);
      setMessages(res.data.messages || []);
    } catch {}
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    await messagesApi.sendText(activeSession, selectedChat, newMessage.trim());
    setNewMessage('');
    await loadMessages(selectedChat);
  };

  const filtered = chats.filter((c) =>
    (c.name || c.id).toLowerCase().includes(search.toLowerCase())
  );

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        Select a session from the sidebar first
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Chat list */}
      <div className="w-80 bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Chats</h2>
            <button onClick={loadChats} className="p-2 text-gray-400 hover:text-white"><RefreshCw size={14} /></button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadMessages(chat.id)}
              className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${selectedChat === chat.id ? 'bg-gray-800' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {(chat.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{chat.name || chat.id}</p>
                  <p className="text-xs text-gray-500">{chat.isGroup ? 'Group' : 'Private'} · {chat.unreadCount || 0} unread</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat view */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                  {(chats.find((c) => c.id === selectedChat)?.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{chats.find((c) => c.id === selectedChat)?.name || selectedChat}</p>
                  <p className="text-xs text-gray-500">{selectedChat}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white"><Archive size={16} /></button>
                <button className="p-2 text-gray-400 hover:text-white"><Pin size={16} /></button>
                <button className="p-2 text-gray-400 hover:text-white"><BellOff size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <p className="text-center text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500">No messages yet</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${m.fromMe ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}>
                      {m.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white flex items-center gap-2"
              >
                <Send size={16} /> Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-gray-600" />
              <p>Select a chat to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
