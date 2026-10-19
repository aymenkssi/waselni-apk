import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Api, createApi } from '../lib/api';
import { API_URL } from '../lib/config';
import { loadSession, saveSession } from '../lib/session';
import { AuthResponse, TwoFactorChallenge, User } from '../lib/types';

export interface RegisterData {
  email: string; password: string; role: User['role']; carrier_type?: 'individual' | 'pro' | null;
  first_name: string; last_name: string; phone: string; country: string; city: string;
}

interface AuthContextType {
  api: Api;
  user: User | null;
  /** Session restored from the device (false while reading it at start-up). */
  ready: boolean;
  /** Returns the 2FA challenge when the account has two-factor authentication. */
  login: (email: string, password: string) => Promise<TwoFactorChallenge | null>;
  verify2fa: (temporaryToken: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Raw access token, for images served behind authentication. */
  accessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  // Tokens live in a ref so the API client always reads the latest ones without re-rendering.
  const tokens = useRef<{ access: string | null; refresh: string | null }>({ access: null, refresh: null });

  const clear = useCallback(() => {
    tokens.current = { access: null, refresh: null };
    setUser(null);
    saveSession(null);
  }, []);

  const api = useMemo(() => createApi(API_URL, {
    getAccess: () => tokens.current.access,
    getRefresh: () => tokens.current.refresh,
    setAccess: (access) => {
      tokens.current.access = access;
      if (tokens.current.refresh) saveSession({ access_token: access, refresh_token: tokens.current.refresh });
    },
    onExpired: clear,
  }), [clear]);

  const start = useCallback(async (res: AuthResponse) => {
    tokens.current = { access: res.access_token, refresh: res.refresh_token };
    await saveSession({ access_token: res.access_token, refresh_token: res.refresh_token });
    setUser(res.user);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadSession();
      if (saved) {
        tokens.current = { access: saved.access_token, refresh: saved.refresh_token };
        try {
          setUser(await api.get<User>('/users/me'));
        } catch (error) {
          // Offline: keep the tokens and try again later; expired session: onExpired already cleared it.
          console.error('Error restoring session:', error);
        }
      }
      setReady(true);
    })();
  }, [api]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.request<AuthResponse | TwoFactorChallenge>('/auth/login', {
      method: 'POST', body: { email: email.trim().toLowerCase(), password }, noRefresh: true,
    });
    if ('requires_2fa' in res && res.requires_2fa) return res;
    await start(res as AuthResponse);
    return null;
  }, [api, start]);

  const verify2fa = useCallback(async (temporaryToken: string, code: string) => {
    const res = await api.request<AuthResponse>('/auth/2fa/verify', { method: 'POST', body: { token: code.trim() }, token: temporaryToken });
    await start(res);
  }, [api, start]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.request<AuthResponse>('/auth/register', {
      method: 'POST', body: { ...data, email: data.email.trim().toLowerCase() }, noRefresh: true,
    });
    await start(res);
  }, [api, start]);

  const logout = useCallback(async () => {
    api.post('/auth/logout').catch(() => undefined);
    clear();
  }, [api, clear]);

  const refreshUser = useCallback(async () => {
    if (tokens.current.access) setUser(await api.get<User>('/users/me'));
  }, [api]);

  const value = useMemo(() => ({
    api, user, ready, login, verify2fa, register, logout, refreshUser, accessToken: () => tokens.current.access,
  }), [api, user, ready, login, verify2fa, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
