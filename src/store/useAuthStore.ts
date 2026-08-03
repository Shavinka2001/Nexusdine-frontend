"use client";

import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

const STORAGE_KEY = "nexusdine.auth";

interface PersistedAuth {
  token: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (token: string, user: AuthUser) => void;
  /** Merge fields into the current user (e.g. restaurant branding) */
  patchUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
  hydrate: () => void;
}

function persist(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  const payload: PersistedAuth = { token, user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearPersisted() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  login: (token, user) => {
    persist(token, user);
    set({
      token,
      user,
      isAuthenticated: true,
      hydrated: true,
    });
  },

  patchUser: (partial) => {
    set((state) => {
      if (!state.user || !state.token) return state;
      const user = { ...state.user, ...partial };
      persist(state.token, user);
      return { user };
    });
  },

  logout: () => {
    clearPersisted();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      hydrated: true,
    });
  },

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          hydrated: true,
        });
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAuth;
      if (!parsed?.token || !parsed?.user?.id) {
        clearPersisted();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          hydrated: true,
        });
        return;
      }

      set({
        token: parsed.token,
        user: parsed.user,
        isAuthenticated: true,
        hydrated: true,
      });
    } catch {
      clearPersisted();
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        hydrated: true,
      });
    }
  },
}));
