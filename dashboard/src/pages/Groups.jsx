import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../api';
import { Users, Plus, LogOut, UserPlus, UserMinus, Crown, ArrowDown } from 'lucide-react';

export default function Groups() {
  const { activeSession } = useApp();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);

  useEffect(() => {
    if (!activeSession) return;
    loadGroups();
  }, [activeSession]);

  const loadGroups = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await groupsApi.list(activeSession);
      setGroups(res.data.groups || []);
    } catch {}
    setLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !activeSession) return;
    await groupsApi.create(activeSession, newGroupName.trim(), []);
    setNewGroupName('');
    setShowCreate(false);
    await loadGroups();
  };

  const viewGroup = async (groupId) => {
    if (!activeSession) return;
    setSelectedGroup(groupId);
    try {
      const res = await groupsApi.get(activeSession, groupId);
      setGroupDetails(res.data.group);
    } catch {}
  };

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
          <h2 className="text-2xl font-bold text-white">Groups</h2>
          <p className="text-gray-400 text-sm">{groups.length} groups</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm"
        >
          <Plus size={16} /> New Group
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
            placeholder="Group name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={createGroup} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No groups yet</div>
          ) : (
            groups.map((g) => (
              <div key={g.id} onClick={() => viewGroup(g.id)} className="p-4 cursor-pointer hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                    <Users size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{g.name || g.id}</p>
                    <p className="text-xs text-gray-500">{g.participants || 0} members</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedGroup && groupDetails && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">{groupDetails.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{groupDetails.description || 'No description'}</p>

            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Participants</p>
              <div className="space-y-2">
                {(groupDetails.participants || []).slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    {p.isAdmin && <Crown size={12} className="text-yellow-400" />}
                    <span className="text-gray-300">{p.id}</span>
                    {p.isSuperAdmin && <span className="text-xs text-yellow-500">Owner</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300">
                <UserPlus size={14} /> Add
              </button>
              <button className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300">
                <UserMinus size={14} /> Remove
              </button>
              <button className="flex items-center gap-1 px-3 py-2 bg-red-900/50 hover:bg-red-900/70 rounded text-sm text-red-400">
                <LogOut size={14} /> Leave
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
