import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as authService from '@/services/auth.service';
import { getToken } from '@/services/api';
import type { User, UserSettings } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signupOrg: (
    organizationName: string,
    name: string,
    email: string,
    password: string
  ) => Promise<string>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
  updateSettings: (settings: UserSettings) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.fetchProfile();
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const signupOrg = useCallback(
    (organizationName: string, name: string, email: string, password: string) =>
      authService.signupOrganization(organizationName, name, email, password),
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const updateSettings = useCallback((settings: UserSettings) => {
    setUser((prev) => (prev ? { ...prev, settings } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signupOrg, logout, updateUser, updateSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
