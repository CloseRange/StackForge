import { createContext, startTransition, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { authService } from "../services/authService";
import { AUTH_EXPIRED_EVENT } from "../services/api";
import type { AccountSettings, AuthPayload, UpdateAccountSettingsInput, User } from "../types/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  getSettings: () => Promise<AccountSettings>;
  updateSettings: (payload: UpdateAccountSettingsInput) => Promise<AccountSettings>;
  accountSettings: AccountSettings | null;
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
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);

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
        setAccountSettings(null);
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

  const getSettings = useCallback(async () => {
    if (!token) {
      throw new Error("Authentication required");
    }

    const settings = await authService.getSettings(token);
    startTransition(() => {
      setAccountSettings(settings);
    });
    return settings;
  }, [token]);

  const updateSettings = useCallback(async (payload: UpdateAccountSettingsInput) => {
    if (!token) {
      throw new Error("Authentication required");
    }

    const settings = await authService.updateSettings(token, payload);
    startTransition(() => {
      setAccountSettings(settings);
    });
    return settings;
  }, [token]);

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
      setAccountSettings(null);
    });
  };

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    let isMounted = true;

    const syncSettings = async () => {
      try {
        const settings = await authService.getSettings(token);

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setAccountSettings(settings);
        });
      } catch {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setAccountSettings(null);
        });
      }
    };

    void syncSettings();

    return () => {
      isMounted = false;
    };
  }, [token, user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const preference = accountSettings?.theme ?? "dark";
      const resolved = preference === "system" ? (media.matches ? "dark" : "light") : preference;

      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };

    applyTheme();

    const onSystemChange = () => {
      if ((accountSettings?.theme ?? "dark") === "system") {
        applyTheme();
      }
    };

    media.addEventListener("change", onSystemChange);
    return () => {
      media.removeEventListener("change", onSystemChange);
    };
  }, [accountSettings?.theme]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      refreshProfile,
      getSettings,
      updateSettings,
      accountSettings,
      updateProfile,
      uploadAvatar,
      logout
    }),
    [
      token,
      user,
      isLoading,
      login,
      register,
      refreshProfile,
      getSettings,
      updateSettings,
      accountSettings,
      updateProfile,
      uploadAvatar,
      logout
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
