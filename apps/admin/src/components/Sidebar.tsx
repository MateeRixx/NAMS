import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/customers', label: 'Customers', icon: 'people' },
  { to: '/products', label: 'Products', icon: 'newspaper' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'assignment' },
  { to: '/complaints', label: 'Complaints', icon: 'warning' },
  { to: '/delivery-zones', label: 'Delivery Zones', icon: 'location_on' },
  { to: '/delivery-sheet', label: 'Delivery Sheet', icon: 'description' },
  { to: '/billing', label: 'Billing', icon: 'account_balance' },
  { to: '/payments', label: 'Payments', icon: 'credit_card' },
  { to: '/billing-charges', label: 'Charges', icon: 'sell' },
  { to: '/marketplace', label: 'Marketplace', icon: 'store' },
  { to: '/reports', label: 'Reports', icon: 'bar_chart' },
  { to: '/audit-logs', label: 'Audit Logs', icon: 'history' },
  { to: '/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

interface SidebarProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function Sidebar({ onClose, isOpen }: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <h2>NewsFlow</h2>
        <span className="badge">Admin</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">&times;</button>
      </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon material-symbols-outlined">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
