import { createContext, startTransition, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services/authService";
import { AUTH_EXPIRED_EVENT } from "../services/api";
import type { AuthPayload, User } from "../types/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: { firstName?: string; lastName?: string; statusMessage?: string; avatarUrl?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
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

  useEffect(() => {
    const handleAuthExpired = () => {
      startTransition(() => {
        setToken(null);
        setUser(null);
      });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const persistAuth = (payload: AuthPayload) => {
    localStorage.setItem(authStorageKey, JSON.stringify(payload));
    startTransition(() => {
      setToken(payload.token);
      setUser(payload.user);
    });
  };

  const persistUser = (nextUser: User) => {
    if (!token) {
      return;
    }

    const payload: AuthPayload = {
      token,
      user: nextUser
    };

    localStorage.setItem(authStorageKey, JSON.stringify(payload));
    startTransition(() => {
      setUser(nextUser);
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

  const refreshProfile = async () => {
    if (!token) {
      return;
    }

    const profile = await authService.getProfile(token);
    persistUser(profile);
  };

  const updateProfile = async (payload: { firstName?: string; lastName?: string; statusMessage?: string; avatarUrl?: string }) => {
    if (!token) {
      return;
    }

    const profile = await authService.updateProfile(token, payload);
    persistUser(profile);
  };

  const uploadAvatar = async (file: File) => {
    if (!token) {
      return;
    }

    const profile = await authService.uploadAvatar(token, file);
    persistUser(profile);
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
        refreshProfile,
        updateProfile,
        uploadAvatar,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
