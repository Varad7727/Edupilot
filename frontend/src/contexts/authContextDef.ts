import { createContext } from 'react';
import type { AuthUser, Role } from '../types';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (role: Role, email: string, password: string) => Promise<void>;
  register: (
    role: Role,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
