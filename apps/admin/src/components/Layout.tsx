import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

const primaryTabs = [
  { to: '/', label: 'Dashboard', icon: 'chart', end: true },
  { to: '/customers', label: 'Customers', icon: 'people', end: false },
  { to: '/billing', label: 'Billing', icon: 'wallet', end: false },
  { to: '/subscriptions', label: 'Subs', icon: 'clipboard', end: false },
  { to: '#more', label: 'More', icon: 'more', end: false },
];

const moreItems = [
  { to: '/products', label: 'Products' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/payments', label: 'Payments' },
  { to: '/delivery-zones', label: 'Delivery Zones' },
  { to: '/delivery-sheet', label: 'Delivery Sheet' },
  { to: '/billing-charges', label: 'Charges' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/reports', label: 'Reports' },
  { to: '/audit-logs', label: 'Audit Logs' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' },
];

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('is-native', isNative);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleMoreClick = useCallback(() => setShowMore(true), []);
  const handleCloseMore = useCallback(() => setShowMore(false), []);

  const isMoreActive = moreItems.some((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  );

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Menu">
              <HamburgerIcon />
            </button>
            <span />
          </div>
          <div className="topbar-right">
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <button className="btn btn-sm btn-logout" onClick={logout}>Logout</button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
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
                  <span>{tab.label}</span>
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
                {tab.icon === 'chart' && <ChartIcon />}
                {tab.icon === 'people' && <PeopleIcon />}
                {tab.icon === 'wallet' && <WalletIcon />}
                {tab.icon === 'clipboard' && <ClipboardIcon />}
                <span>{tab.label}</span>
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
                {item.label}
              </NavLink>
            ))}
            <div className="more-divider" />
            <button className="more-item more-item-logout" onClick={() => { setShowMore(false); logout(); }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
