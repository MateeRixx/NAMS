import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <span />
          <div className="topbar-right">
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <button className="btn btn-sm" onClick={logout}>Logout</button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
