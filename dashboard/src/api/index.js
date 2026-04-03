import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key-change-me',
  },
});

export const sessionsApi = {
  list: () => api.get('/sessions'),
  create: (sessionId) => api.post('/sessions', { sessionId }),
  get: (sessionId) => api.get(`/sessions/${sessionId}`),
  getQr: (sessionId) => api.get(`/sessions/${sessionId}/qr`),
  delete: (sessionId) => api.delete(`/sessions/${sessionId}`),
  logout: (sessionId) => api.post(`/sessions/${sessionId}/logout`),
  typing: (sessionId, chatId, isTyping) =>
    api.post(`/sessions/${sessionId}/typing`, { chatId, isTyping }),
};

export const messagesApi = {
  sendText: (sessionId, chatId, text) =>
    api.post(`/sessions/${sessionId}/messages/text`, { chatId, text }),
  sendReply: (sessionId, chatId, text, messageId) =>
    api.post(`/sessions/${sessionId}/messages/reply`, { chatId, text, messageId }),
  sendReact: (sessionId, chatId, messageId, reaction) =>
    api.post(`/sessions/${sessionId}/messages/react`, { chatId, messageId, reaction }),
  sendPoll: (sessionId, chatId, title, options) =>
    api.post(`/sessions/${sessionId}/messages/poll`, { chatId, title, options }),
  sendLocation: (sessionId, chatId, latitude, longitude, title) =>
    api.post(`/sessions/${sessionId}/messages/location`, { chatId, latitude, longitude, title }),
  getMessage: (sessionId, messageId) =>
    api.get(`/sessions/${sessionId}/messages/${messageId}`),
};

export const chatsApi = {
  list: (sessionId) => api.get(`/sessions/${sessionId}/chats`),
  get: (sessionId, chatId) => api.get(`/sessions/${sessionId}/chats/${chatId}`),
  getMessages: (sessionId, chatId, limit = 50) =>
    api.get(`/sessions/${sessionId}/chats/${chatId}/messages?limit=${limit}`),
  delete: (sessionId, chatId) => api.delete(`/sessions/${sessionId}/chats/${chatId}`),
  archive: (sessionId, chatId, archive = true) =>
    api.post(`/sessions/${sessionId}/chats/${chatId}/archive`, { archive }),
  pin: (sessionId, chatId, pin = true) =>
    api.post(`/sessions/${sessionId}/chats/${chatId}/pin`, { pin }),
  mute: (sessionId, chatId, mute = true, duration) =>
    api.post(`/sessions/${sessionId}/chats/${chatId}/mute`, { mute, duration }),
  clear: (sessionId, chatId) =>
    api.post(`/sessions/${sessionId}/chats/${chatId}/clear`),
};

export const contactsApi = {
  list: (sessionId) => api.get(`/sessions/${sessionId}/contacts`),
  get: (sessionId, contactId) => api.get(`/sessions/${sessionId}/contacts/${contactId}`),
  getProfilePic: (sessionId, contactId) =>
    api.get(`/sessions/${sessionId}/contacts/${contactId}/profile-pic`),
  block: (sessionId, contactId) =>
    api.post(`/sessions/${sessionId}/contacts/${contactId}/block`),
  unblock: (sessionId, contactId) =>
    api.post(`/sessions/${sessionId}/contacts/${contactId}/unblock`),
};

export const groupsApi = {
  list: (sessionId) => api.get(`/sessions/${sessionId}/groups`),
  create: (sessionId, name, participants) =>
    api.post(`/sessions/${sessionId}/groups`, { name, participants }),
  get: (sessionId, groupId) => api.get(`/sessions/${sessionId}/groups/${groupId}`),
  update: (sessionId, groupId, data) =>
    api.put(`/sessions/${sessionId}/groups/${groupId}`, data),
  leave: (sessionId, groupId) =>
    api.post(`/sessions/${sessionId}/groups/${groupId}/leave`),
  addParticipants: (sessionId, groupId, participants) =>
    api.post(`/sessions/${sessionId}/groups/${groupId}/participants/add`, { participants }),
  removeParticipants: (sessionId, groupId, participants) =>
    api.post(`/sessions/${sessionId}/groups/${groupId}/participants/remove`, { participants }),
  promote: (sessionId, groupId, participants) =>
    api.post(`/sessions/${sessionId}/groups/${groupId}/promote`, { participants }),
  demote: (sessionId, groupId, participants) =>
    api.post(`/sessions/${sessionId}/groups/${groupId}/demote`, { participants }),
};

export const mediaApi = {
  send: (sessionId, chatId, file, caption) => {
    const form = new FormData();
    form.append('chatId', chatId);
    form.append('file', file);
    if (caption) form.append('caption', caption);
    return api.post(`/sessions/${sessionId}/media/send`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  sendUrl: (sessionId, chatId, url, caption, mimetype) =>
    api.post(`/sessions/${sessionId}/media/url`, { chatId, url, caption, mimetype }),
  sendBase64: (sessionId, chatId, base64, caption, mimetype, filename) =>
    api.post(`/sessions/${sessionId}/media/base64`, { chatId, base64, caption, mimetype, filename }),
  download: (sessionId, messageId) =>
    api.get(`/sessions/${sessionId}/media/${messageId}`),
};

export const statusApi = {
  sendText: (sessionId, text, backgroundColor) =>
    api.post(`/sessions/${sessionId}/status/text`, { text, backgroundColor }),
  sendMedia: (sessionId, url, base64, mimetype, caption) =>
    api.post(`/sessions/${sessionId}/status/media`, { url, base64, mimetype, caption }),
};

export const webhooksApi = {
  register: (sessionId, url, events) =>
    api.post(`/sessions/${sessionId}/webhooks`, { url, events }),
  get: (sessionId) => api.get(`/sessions/${sessionId}/webhooks`),
  delete: (sessionId) => api.delete(`/sessions/${sessionId}/webhooks`),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
