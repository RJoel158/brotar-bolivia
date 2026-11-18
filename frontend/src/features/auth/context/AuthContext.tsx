import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import {
  authApi,
  type LoginPayload,
  type RegisterPayload,
} from '../../../shared/api/authApi.ts';
import { AUTH_UNAUTHORIZED_EVENT } from '../../../shared/api/apiClient.ts';
import type { UserProfile } from '../../../shared/types/index.ts';
import { homeRouteForRole } from '../utils/roleHome.ts';
import { AuthContext } from './auth-context.ts';
import type { AuthContextValue } from './auth-context.types.ts';

export type { AuthContextValue } from './auth-context.types.ts';

export interface AuthProviderProps {
  children: ReactNode;
}

function hasStoredAccessToken(): boolean {
  return Boolean(localStorage.getItem('brotar_access_token'));
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(hasStoredAccessToken);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const hydrateSession = useCallback(async () => {
    const token = localStorage.getItem('brotar_access_token');
    if (!token) {
      setUser(null);
      setIsBootstrapping(false);
      return null;
    }

    try {
      const me = await authApi.getMe();
      setUser(me);
      return me;
    } catch {
      authApi.logout();
      setUser(null);
      return null;
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (!hasStoredAccessToken()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const me = await authApi.getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        authApi.logout();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedUser } = await authApi.login(payload);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: registeredUser } = await authApi.register(payload);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const refreshUser = useCallback(async () => {
    return hydrateSession();
  }, [hydrateSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
      refreshUser,
      homeRoute: user ? homeRouteForRole(user.role) : 'home',
    }),
    [user, isBootstrapping, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
