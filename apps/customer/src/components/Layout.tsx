import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ErrorBoundary from './ErrorBoundary';

const tabs = [
  { to: '/', label: 'Home', end: true, key: 'nav_home' },
  { to: '/cart', label: 'Cart', key: 'nav_cart' },
  { to: '/products', label: 'Products', key: 'nav_products' },
  { to: '/subscriptions', label: 'My Subs', key: 'nav_subs' },
  { to: '/invoices', label: 'Invoices', key: 'nav_invoices' },
  { to: '/complaints', label: 'Complaints', key: 'nav_complaints' },
  { to: '/marketplace', label: 'Marketplace', key: 'nav_marketplace' },
  { to: '/notifications', label: 'Alerts', key: 'nav_alerts' },
  { to: '/profile', label: 'Profile', key: 'nav_profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { t, locale, setLocale } = useLanguage();

  return (
    <div className="app-layout">
      <header className="app-header">
        <h2>NewsFlow</h2>
        <div className="header-right">
          <span className="user-name">{user?.firstName}</span>
          <button className="btn btn-sm btn-header" onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}>
            {locale === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <button className="btn btn-sm btn-header" onClick={logout}>{t().nav_logout}</button>
        </div>
      </header>
      <nav className="nav-tabs">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}>
            {(t() as Record<string, string>)[tab.key] || tab.label}{tab.to === '/cart' && itemCount > 0 ? ` (${itemCount})` : ''}
          </NavLink>
        ))}
      </nav>
      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
