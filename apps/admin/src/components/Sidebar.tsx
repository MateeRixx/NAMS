import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/products', label: 'Products', icon: '📰' },
  { to: '/subscriptions', label: 'Subscriptions', icon: '📋' },
  { to: '/complaints', label: 'Complaints', icon: '⚠️' },
  { to: '/delivery-zones', label: 'Delivery Zones', icon: '📍' },
  { to: '/billing', label: 'Billing', icon: '💰' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>NewsFlow</h2>
        <span className="badge">Admin</span>
      </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
