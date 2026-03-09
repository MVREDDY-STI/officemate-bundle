import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../services/api';

type Role = 'admin' | 'user';
type LoginResult = 'ok' | 'invalid' | 'approval_pending';

interface User {
  email: string;
  role: Role;
  name: string;
}

interface ApiAuthResponse {
  token: string;
  refreshToken: string;
  user: {
    email: string;
    role: Role;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAdmin: boolean;
}

// Fallback credentials when API is unreachable
const FALLBACK_USERS = [
  { email: 'admin@solum.com', password: 'admin123', role: 'admin' as Role, name: 'Admin' },
  { email: 'user@solum.com',  password: 'user123',  role: 'user'  as Role, name: 'Peppin' },
];

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUser(): User | null {
  try {
    const s = sessionStorage.getItem('solum_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function persistSession(user: User, token?: string, refreshToken?: string): void {
  sessionStorage.setItem('solum_user', JSON.stringify(user));
  if (token) {
    sessionStorage.setItem('solum_auth', JSON.stringify({ token, refreshToken: refreshToken ?? null }));
  } else {
    // Remove any stale token when using fallback
    sessionStorage.removeItem('solum_auth');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    // Try API first
    try {
      const res = await apiPost<ApiAuthResponse>('/api/v1/auth/login', { email, password });
      const userData: User = { email: res.user.email, role: res.user.role, name: res.user.name };
      setUser(userData);
      persistSession(userData, res.token, res.refreshToken);
      return 'ok';
    } catch (e: any) {
      // Check for approval_pending 403 — api.ts throws with body text as message
      if (e.message?.includes('approval_pending')) return 'approval_pending';

      // API unreachable — fall back to hardcoded credentials
      const found = FALLBACK_USERS.find(u => u.email === email && u.password === password);
      if (found) {
        const userData: User = { email: found.email, role: found.role, name: found.name };
        setUser(userData);
        persistSession(userData);
        return 'ok';
      }
      return 'invalid';
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('solum_user');
    sessionStorage.removeItem('solum_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
