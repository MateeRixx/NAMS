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
  login: (email: string, otp: string) => Promise<void>;
  register: (email: string, otp: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  sendEmailOtp: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(() => {
    const stored = localStorage.getItem('customer_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('customer_token'));
  const [loading] = useState(false);

  async function sendEmailOtp(email: string) {
    await client.post('/auth/otp/send-email', { email });
  }

  async function register(email: string, otp: string, firstName: string, lastName: string, phone?: string) {
    const res = await client.post('/auth/customer/register', { email, otp, firstName, lastName, ...(phone ? { phone } : {}) });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('customer_token', newToken);
    localStorage.setItem('customer_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }

  async function login(email: string, otp: string) {
    const res = await client.post('/auth/customer/otp/verify', { email, otp });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('customer_token', newToken);
    localStorage.setItem('customer_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, sendEmailOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
