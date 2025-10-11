import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setTokenResolver, type ApiResponse } from '../lib/http';
import {
  login as loginRequest,
  logout as logoutRequest,
  type LoginPayload,
  type LoginResponse,
} from '../services/auth';
import { getCurrentUser, type UserInfo } from '../services/user';

export interface AuthUser {
  id: string;
  username: string;
  roles: string[];
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<ApiResponse<LoginResponse>>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<ApiResponse<UserInfo>>;
  setAuthUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'accessToken';
const USER_ID_KEY = 'userId';
const USERNAME_KEY = 'username';
const USER_ROLES_KEY = 'userRoles';

const readAuthFromStorage = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    const id = window.localStorage.getItem(USER_ID_KEY);
    const username = window.localStorage.getItem(USERNAME_KEY);
    const rolesRaw = window.localStorage.getItem(USER_ROLES_KEY);

    if (accessToken && id && username) {
      const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
      return {
        accessToken,
        id,
        username,
        roles: Array.isArray(roles) ? roles : [],
      };
    }
  } catch {
    return null;
  }

  return null;
};

const syncAuthToStorage = (user: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, user.accessToken);
      window.localStorage.setItem(USER_ID_KEY, user.id);
      window.localStorage.setItem(USERNAME_KEY, user.username);
      window.localStorage.setItem(USER_ROLES_KEY, JSON.stringify(user.roles ?? []));
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(USER_ID_KEY);
      window.localStorage.removeItem(USERNAME_KEY);
      window.localStorage.removeItem(USER_ROLES_KEY);
    }
  } catch {
    // 忽略本地存储写入异常
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const initialUser = readAuthFromStorage();
    setTokenResolver(() => initialUser?.accessToken ?? undefined);
    return initialUser;
  });

  const setAuthUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
    setTokenResolver(() => nextUser?.accessToken ?? undefined);
    syncAuthToStorage(nextUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload);
      const result = response.data;
      setAuthUser({
        accessToken: result.accessToken,
        id: result.id,
        username: result.username,
        roles: result.roles,
      });
      return response;
    },
    [setAuthUser],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAuthUser(null);
    }
  }, [setAuthUser]);

  const fetchCurrentUser = useCallback(async () => {
    const stored = readAuthFromStorage();
    const accessToken = stored?.accessToken ?? user?.accessToken;

    if (!accessToken) {
      setAuthUser(null);
      throw new Error('UNAUTHORIZED');
    }

    try {
      const response = await getCurrentUser();
      const info = response.data;

      setAuthUser({
        accessToken,
        id: info._id,
        username: info.username,
        roles: info.roles ?? [],
      });

      return response;
    } catch (error) {
      setAuthUser(null);
      throw error;
    }
  }, [setAuthUser, user?.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      logout,
      fetchCurrentUser,
      setAuthUser,
    }),
    [user, login, logout, fetchCurrentUser, setAuthUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 中使用');
  }
  return context;
};
