import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { useEffect, useState } from 'react';
import client from './api/client';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Complaints from './pages/Complaints';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Marketplace from './pages/Marketplace';
import Onboarding from './pages/Onboarding';
import Cart from './pages/Cart';
import PaymentConfirmation from './pages/PaymentConfirmation';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    client.get('/customer-portal/onboarding')
      .then((res) => {
        if (!res.data.data.completed) {
          navigate('/onboarding', { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [token, navigate]);

  if (checking) return <div className="loading">Loading...</div>;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      <Route
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <Layout />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/invoices/:id/confirmation" element={<PaymentConfirmation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
