import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  MessageSquare, Users, User, Settings, Webhook, BookOpen,
  LayoutDashboard, Radio, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sessions', label: 'Sessions', icon: Radio },
  { to: '/chats', label: 'Chats', icon: MessageSquare },
  { to: '/contacts', label: 'Contacts', icon: User },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/status', label: 'Status', icon: Radio },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/docs', label: 'Docs', icon: BookOpen },
];

export default function Layout() {
  const { activeSession, sessions } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const activeSessionData = sessions.find((s) => s.id === activeSession);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">SirClaw WhatsApp</h1>
              <p className="text-xs text-gray-400">HTTP API Dashboard</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Active session indicator */}
          {activeSession && (
            <div className="mt-3 px-3 py-2 bg-gray-800 rounded-lg text-xs">
              <span className="text-gray-400">Active session: </span>
              <span className="text-white font-medium">{activeSession}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${activeSessionData?.ready ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className={activeSessionData?.ready ? 'text-green-400' : 'text-yellow-400'}>
                  {activeSessionData?.ready ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-r-2 border-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          whatsapp-http-api v1.0
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <span className="text-gray-400 text-sm">
              {nav.find((n) => n.to === location.pathname)?.label || 'SirClaw'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ChevronRight size={14} />
            <span>{activeSession || 'No session'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
