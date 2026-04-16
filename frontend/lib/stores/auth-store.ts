"use client";

import { AxiosError } from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import api from "@/lib/api";

const AUTH_STORAGE_KEY = "dusk-auth-store";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  setHydrated: (value: boolean) => void;
  register: (payload: RegisterInput) => Promise<void>;
  login: (payload: LoginInput) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearSession: () => void;
};

const toMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isHydrated: false,
      error: null,

      setHydrated: (value) => {
        set({ isHydrated: value });
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/auth/register", payload);

          api.defaults.headers.common.Authorization = `Bearer ${data.tokens.accessToken}`;
          set({
            user: data.user,
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            error: null,
          });
        } catch (error) {
          const message = toMessage(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/auth/login", payload);

          api.defaults.headers.common.Authorization = `Bearer ${data.tokens.accessToken}`;
          set({
            user: data.user,
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            error: null,
          });
        } catch (error) {
          const message = toMessage(error);
          set({ error: message });
          throw new Error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSession: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          return false;
        }

        try {
          const { data } = await api.post<AuthTokens>("/auth/refresh", {
            refreshToken,
          });

          api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            error: null,
          });

          return true;
        } catch {
          get().clearSession();
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.post("/auth/logout");
        } catch {
          // no-op, we still clear local session
        } finally {
          get().clearSession();
          set({ isLoading: false });
        }
      },

      clearSession: () => {
        delete api.defaults.headers.common.Authorization;
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.defaults.headers.common.Authorization = `Bearer ${state.accessToken}`;
        }

        state?.setHydrated(true);
      },
    },
  ),
);

export type { AuthUser, LoginInput, RegisterInput };
export default useAuthStore;