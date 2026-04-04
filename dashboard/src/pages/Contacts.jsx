import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { contactsApi } from '../api';
import { User, Search, Ban, Unlock, Image } from 'lucide-react';

export default function Contacts() {
  const { activeSession } = useApp();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeSession) return;
    loadContacts();
  }, [activeSession]);

  const loadContacts = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await contactsApi.list(activeSession);
      setContacts(res.data.contacts || []);
    } catch {}
    setLoading(false);
  };

  const toggleBlock = async (id, isBlocked) => {
    if (!activeSession) return;
    if (isBlocked) {
      await contactsApi.unblock(activeSession, id);
    } else {
      await contactsApi.block(activeSession, id);
    }
    await loadContacts();
  };

  const filtered = contacts.filter((c) =>
    (c.name || c.pushname || c.id).toLowerCase().includes(search.toLowerCase())
  );

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        Select a session first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contacts</h2>
          <p className="text-gray-400 text-sm">{contacts.length} contacts</p>
        </div>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No contacts found</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                  {(c.name || c.pushname || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{c.name || c.pushname || c.id}</p>
                  <p className="text-xs text-gray-500">{c.id} · {c.isGroup ? 'Group' : 'Contact'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white"><Image size={16} /></button>
                <button
                  onClick={() => toggleBlock(c.id, c.blockCount > 0)}
                  className={`p-2 ${c.blockCount > 0 ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                >
                  {c.blockCount > 0 ? <Unlock size={16} /> : <Ban size={16} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
