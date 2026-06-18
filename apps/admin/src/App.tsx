import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Subscriptions from './pages/Subscriptions';
import Complaints from './pages/Complaints';
import DeliveryZones from './pages/DeliveryZones';
import DeliverySheet from './pages/DeliverySheet';
import Billing from './pages/Billing';
import BillingCharges from './pages/BillingCharges';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Marketplace from './pages/Marketplace';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Payments from './pages/Payments';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/delivery-zones" element={<DeliveryZones />} />
        <Route path="/delivery-sheet" element={<DeliverySheet />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing-charges" element={<BillingCharges />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
