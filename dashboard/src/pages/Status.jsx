import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { statusApi } from '../api';
import { Radio, Image, Send, Palette } from 'lucide-react';

export default function Status() {
  const { activeSession } = useApp();
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [bgColor, setBgColor] = useState('#25D366');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const postTextStatus = async () => {
    if (!text.trim() || !activeSession) return;
    setLoading(true);
    try {
      await statusApi.sendText(activeSession, text.trim(), bgColor);
      setText('');
      alert('Status posted!');
    } catch {}
    setLoading(false);
  };

  const postMediaStatus = async () => {
    if (!mediaUrl.trim() || !activeSession) return;
    setLoading(true);
    try {
      await statusApi.sendMedia(activeSession, mediaUrl.trim(), null, null, caption);
      setMediaUrl('');
      setCaption('');
      alert('Media status posted!');
    } catch {}
    setLoading(false);
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
        <h2 className="text-2xl font-bold text-white">Status (Stories)</h2>
        <p className="text-gray-400 text-sm mt-1">Post updates visible to all contacts</p>
      </div>

      {/* Text Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={18} className="text-green-400" />
          <h3 className="text-white font-semibold">Text Status</h3>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={700}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
        />

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-gray-400" />
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <span className="text-sm text-gray-400">{background}</span>
          </div>

          <span className="text-xs text-gray-500 ml-auto">{text.length}/700</span>
        </div>

        <button
          onClick={postTextStatus}
          disabled={!text.trim() || loading}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white"
        >
          <Send size={16} /> Post Status
        </button>
      </div>

      {/* Media Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image size={18} className="text-blue-400" />
          <h3 className="text-white font-semibold">Media Status</h3>
        </div>

        <input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="Image or video URL"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
        />

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={postMediaStatus}
          disabled={!mediaUrl.trim() || loading}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white"
        >
          <Send size={16} /> Post Media
        </button>
      </div>
    </div>
  );
}
