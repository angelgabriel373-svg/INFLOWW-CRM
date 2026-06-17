import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { ADMIN: 'Administrador', MANAGER: 'Team Leader', CHATTER: 'Chatter' };

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/models', label: 'Modelos', icon: '💃' },
  { to: '/scripts', label: 'Scripts', icon: '📝' },
  { to: '/tickets', label: 'Tickets', icon: '🎫' },
  { to: '/users', label: 'Equipo', icon: '👥', roles: ['ADMIN', 'MANAGER'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 h-full w-64 transform border-r border-ink-600 bg-ink-800 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-ink-600 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 font-bold text-white">O</div>
          <div>
            <div className="text-sm font-semibold">OFM CRM</div>
            <div className="text-xs text-gray-500">Panel de gestion</div>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {links.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-gray-300 hover:bg-ink-600'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-ink-600 p-3">
          <div className="mb-2 rounded-lg bg-ink-700 px-3 py-2">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="text-xs text-brand-400">{ROLE_LABEL[user.role]}</div>
          </div>
          <button onClick={logout} className="btn btn-ghost w-full">Cerrar sesion</button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/50 md:hidden" />}

      {/* Contenido */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-ink-600 bg-ink-800 px-4 md:hidden">
          <button onClick={() => setOpen(true)} className="btn btn-ghost px-3">☰</button>
          <span className="font-semibold">OFM CRM</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
