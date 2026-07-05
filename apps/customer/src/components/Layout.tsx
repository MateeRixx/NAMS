import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ErrorBoundary from './ErrorBoundary';
import PushNotificationManager from './PushNotificationManager';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { lightImpact, mediumImpact } from '../utils/haptics';

const isNative = Capacitor.isNativePlatform();

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

const allTabs = [
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

const primaryTabs = [
  { to: '/', label: 'Home', icon: 'home', end: true, key: 'nav_home' },
  { to: '/products', label: 'Products', icon: 'grid', end: false, key: 'nav_products' },
  { to: '/subscriptions', label: 'My Subs', icon: 'clipboard', end: false, key: 'nav_subs' },
  { to: '/cart', label: 'Cart', icon: 'cart', end: false, key: 'nav_cart' },
  { to: '#more', label: 'More', icon: 'more', end: false, key: 'nav_more' },
];

const moreItems = [
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
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const tr = t() as Record<string, string>;
  const unreadCount = useUnreadNotifications();

  useEffect(() => {
    document.body.classList.toggle('is-native', isNative);
  }, []);

  const isMoreActive = moreItems.some((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  );

  const handleMoreClick = useCallback(() => {
    if (isNative) lightImpact();
    setShowMore(true);
  }, []);

  const handleCloseMore = useCallback(() => {
    setShowMore(false);
  }, []);

  const handleLogout = useCallback(() => {
    if (isNative) mediumImpact();
    setShowMore(false);
    logout();
  }, [logout]);

  return (
    <div className="app-layout">
      <PushNotificationManager />
      <header className="app-header">
        <h2>NewsFlow</h2>
        <div className="header-right">
          <span className="user-name">{user?.firstName}</span>
          <button className="btn btn-sm btn-header" onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}>
            {locale === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <button className="btn btn-sm btn-header btn-logout" onClick={logout}>{tr.nav_logout || 'Logout'}</button>
        </div>
      </header>

      {isNative ? null : (
        <nav className="nav-tabs">
          {allTabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end}
              className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
            >
              {tr[tab.key] || tab.label}
              {tab.to === '/cart' && itemCount > 0 ? ` (${itemCount})` : ''}
              {tab.to === '/notifications' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </NavLink>
          ))}
        </nav>
      )}

      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {isNative ? (
        <nav className="tab-bar">
          {primaryTabs.map((tab) => {
            if (tab.to === '#more') {
              return (
                <button
                  key="more"
                  className={`tab-bar-item${isMoreActive ? ' active' : ''}`}
                  onClick={handleMoreClick}
                  aria-label="More"
                >
                  <MoreIcon />
                  <span>{tr[tab.key] || tab.label}</span>
                </button>
              );
            }

            const isActive = tab.end
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to);

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={`tab-bar-item${isActive ? ' active' : ''}`}
                aria-label={tab.label}
              >
                {tab.icon === 'home' && <HomeIcon />}
                {tab.icon === 'grid' && <GridIcon />}
                {tab.icon === 'clipboard' && <ClipboardIcon />}
                  {tab.icon === 'cart' && (
                    <>
                      <CartIcon />
                      {itemCount > 0 && <span className="tab-bar-badge">{itemCount > 9 ? '9+' : itemCount}</span>}
                    </>
                  )}
                  {tab.to === '/notifications' && unreadCount > 0 && (
                    <span className="tab-bar-badge nav-alerts-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                  <span>{tr[tab.key] || tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      ) : null}

      {isNative && showMore && (
        <div className="more-overlay" onClick={handleCloseMore}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="more-sheet-handle" />
            {moreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="more-item"
                onClick={handleCloseMore}
              >
                {tr[item.key] || item.label}
              </NavLink>
            ))}
            <div className="more-divider" />
            <button className="more-item" onClick={() => { setShowMore(false); setLocale(locale === 'en' ? 'hi' : 'en'); }}>
              {locale === 'en' ? 'हिन्दी' : 'English'}
            </button>
            <button className="more-item more-item-logout" onClick={handleLogout}>
              {tr.nav_logout || 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
