import { createContext, useContext, useState, useEffect } from 'react';
import { sessionsApi } from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      const res = await sessionsApi.list();
      setSessions(res.data.sessions || []);
      const firstReady = (res.data.sessions || []).find((s) => s.ready);
      if (firstReady && !activeSession) setActiveSession(firstReady.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const createSession = async (sessionId) => {
    setLoading(true);
    try {
      await sessionsApi.create(sessionId);
      setActiveSession(sessionId);
      await fetchSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await sessionsApi.delete(sessionId);
      if (activeSession === sessionId) setActiveSession(null);
      await fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      sessions, activeSession, setActiveSession,
      loading, error, setError,
      fetchSessions, createSession, deleteSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
