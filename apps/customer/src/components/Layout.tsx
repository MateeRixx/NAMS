import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/subscriptions', label: 'My Subs' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <h2>NewsFlow</h2>
        <div className="header-right">
          <span className="user-name">{user?.firstName}</span>
          <button className="btn btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={logout}>Logout</button>
        </div>
      </header>
      <nav className="nav-tabs">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
