import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { apiUrl } from "@/lib/api";
import {
  registerForPushAndSyncToken,
  unregisterPushToken,
} from "@/lib/pushNotifications";

const TOKEN_KEY = "skinfit_session_token";
const USER_KEY = "skinfit_user_json";

export type AuthUser = { id: string; email: string; name: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** After profile save (email change issues a new JWT on native). */
  applySessionFromProfile: (data: {
    token?: string;
    user: { id: string; name: string; email: string };
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, u] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (cancelled) return;
        setToken(t);
        if (u) {
          try {
            setUser(JSON.parse(u) as AuthUser);
          } catch {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Skinfit-Client": "native",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      throw new Error(
        "Cannot reach the server. Check your internet and EXPO_PUBLIC_API_URL."
      );
    }

    const text = await res.text().catch(() => "");
    let data: {
      ok?: boolean;
      token?: string;
      user?: AuthUser;
      message?: string;
      error?: string;
    } = {};
    try {
      data = text ? (JSON.parse(text) as typeof data) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Sign in failed (HTTP ${res.status}). Server may be unavailable.`
      );
    }
    if (!data.token || !data.user) {
      throw new Error("Server did not return a session token.");
    }
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setToken(data.token);

    if (Platform.OS !== "web") {
      void registerForPushAndSyncToken(data.token, {
        verboseAlerts: false,
        requestPermission: true,
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    const prevToken = token;
    if (prevToken && Platform.OS !== "web") {
      try {
        await unregisterPushToken(prevToken);
      } catch {
        /* offline or expired session — still sign out locally */
      }
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const applySessionFromProfile = useCallback(
    async (data: {
      token?: string;
      user: { id: string; name: string; email: string };
    }) => {
      if (data.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        setToken(data.token);
        if (Platform.OS !== "web") {
          void registerForPushAndSyncToken(data.token, {
            verboseAlerts: false,
            requestPermission: true,
          });
        }
      }
      const next: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      };
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(next));
      setUser(next);
    },
    []
  );

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      signIn,
      signOut,
      applySessionFromProfile,
    }),
    [token, user, ready, signIn, signOut, applySessionFromProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
