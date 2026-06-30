import { createContext, useContext, useState, type ReactNode } from 'react';
import client from '../api/client';

interface CustomerUser {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  agencyId: string;
}

interface AuthContextType {
  user: CustomerUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ message: string; otp?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<CustomerUser>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const stored = localStorage.getItem('customer_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('customer_user');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('customer_token');
    if (t === 'undefined' || t === 'null') {
      localStorage.removeItem('customer_token');
      return null;
    }
    return t;
  });
  const [loading] = useState(false);

  async function login(email: string, password: string) {
    const res = await client.post('/auth/customer/login', { email, password });
    const { token: newToken, user: userData } = res.data?.data ?? {};
    if (newToken && userData) {
      localStorage.setItem('customer_token', newToken);
      localStorage.setItem('customer_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    }
  }

  async function register(email: string, password: string, firstName: string, lastName: string, phone?: string) {
    const res = await client.post('/auth/customer/register', { email, password, firstName, lastName, ...(phone ? { phone } : {}) });
    return res.data?.data ?? { message: 'Account created' };
  }

  async function verifyEmail(email: string, otp: string) {
    const res = await client.post('/auth/customer/verify-email', { email, otp });
    const { token: newToken, user: userData } = res.data?.data ?? {};
    if (newToken && userData) {
      localStorage.setItem('customer_token', newToken);
      localStorage.setItem('customer_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    }
  }

  function updateUser(data: Partial<CustomerUser>) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('customer_user', JSON.stringify(updated));
      return updated;
    });
  }

  function logout() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    localStorage.removeItem('cart');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, verifyEmail, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
