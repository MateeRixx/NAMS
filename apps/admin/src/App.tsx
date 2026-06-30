import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Products = lazy(() => import('./pages/Products'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Complaints = lazy(() => import('./pages/Complaints'));
const DeliveryZones = lazy(() => import('./pages/DeliveryZones'));
const DeliverySheet = lazy(() => import('./pages/DeliverySheet'));
const Billing = lazy(() => import('./pages/Billing'));
const BillingCharges = lazy(() => import('./pages/BillingCharges'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Reports = lazy(() => import('./pages/Reports'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Payments = lazy(() => import('./pages/Payments'));

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
        <Route path="/" element={<Suspense fallback={<div className="loading">Loading...</div>}><Dashboard /></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={<div className="loading">Loading...</div>}><Customers /></Suspense>} />
        <Route path="/products" element={<Suspense fallback={<div className="loading">Loading...</div>}><Products /></Suspense>} />
        <Route path="/subscriptions" element={<Suspense fallback={<div className="loading">Loading...</div>}><Subscriptions /></Suspense>} />
        <Route path="/complaints" element={<Suspense fallback={<div className="loading">Loading...</div>}><Complaints /></Suspense>} />
        <Route path="/delivery-zones" element={<Suspense fallback={<div className="loading">Loading...</div>}><DeliveryZones /></Suspense>} />
        <Route path="/delivery-sheet" element={<Suspense fallback={<div className="loading">Loading...</div>}><DeliverySheet /></Suspense>} />
        <Route path="/billing" element={<Suspense fallback={<div className="loading">Loading...</div>}><Billing /></Suspense>} />
        <Route path="/billing-charges" element={<Suspense fallback={<div className="loading">Loading...</div>}><BillingCharges /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<div className="loading">Loading...</div>}><Settings /></Suspense>} />
        <Route path="/notifications" element={<Suspense fallback={<div className="loading">Loading...</div>}><Notifications /></Suspense>} />
        <Route path="/marketplace" element={<Suspense fallback={<div className="loading">Loading...</div>}><Marketplace /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<div className="loading">Loading...</div>}><Reports /></Suspense>} />
        <Route path="/audit-logs" element={<Suspense fallback={<div className="loading">Loading...</div>}><AuditLogs /></Suspense>} />
        <Route path="/payments" element={<Suspense fallback={<div className="loading">Loading...</div>}><Payments /></Suspense>} />
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
