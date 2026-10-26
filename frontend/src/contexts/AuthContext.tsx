import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { AuthUser, Role } from '../types';
import { authApi } from '../api';
import { AuthContext } from './authContextDef';

const USER_KEY = 'amit_user';
const TOKEN_KEY = 'amit_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Listen for 401 events fired by the Axios interceptor
  useEffect(() => {
    const handler = () => {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const persist = (u: AuthUser | null, token?: string) => {
    setUser(u);
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      if (token) localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const login = useCallback(
    async (role: Role, email: string, password: string) => {
      setIsLoading(true);
      try {
        const fn =
          role === 'student' ? authApi.loginStudent : authApi.loginTeacher;
        const res = await fn({ email, password });
        persist(res.data.user, res.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (
      role: Role,
      firstName: string,
      lastName: string,
      email: string,
      password: string
    ) => {
      setIsLoading(true);
      try {
        const fn =
          role === 'student'
            ? authApi.registerStudent
            : authApi.registerTeacher;
        const res = await fn({ firstName, lastName, email, password });
        persist(res.data.user, res.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (user?.role === 'student') await authApi.logoutStudent();
      else if (user?.role === 'teacher') await authApi.logoutTeacher();
    } catch {
      // best-effort
    } finally {
      persist(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from './useAuth';
export { AuthContext } from './authContextDef';
