import { createContext, startTransition, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services/authService";
import type { AuthPayload, User } from "../types/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => void;
};

const authStorageKey = "stackforge-auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredAuth = (): AuthPayload | null => {
  const stored = localStorage.getItem(authStorageKey);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuthPayload;
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = readStoredAuth();

    startTransition(() => {
      setToken(storedAuth?.token ?? null);
      setUser(storedAuth?.user ?? null);
      setIsLoading(false);
    });
  }, []);

  const persistAuth = (payload: AuthPayload) => {
    localStorage.setItem(authStorageKey, JSON.stringify(payload));
    startTransition(() => {
      setToken(payload.token);
      setUser(payload.user);
    });
  };

  const login = async (payload: { email: string; password: string }) => {
    const auth = await authService.login(payload);
    persistAuth(auth);
  };

  const register = async (payload: { email: string; password: string; displayName: string }) => {
    const auth = await authService.register(payload);
    persistAuth(auth);
  };

  const logout = () => {
    localStorage.removeItem(authStorageKey);
    startTransition(() => {
      setToken(null);
      setUser(null);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
