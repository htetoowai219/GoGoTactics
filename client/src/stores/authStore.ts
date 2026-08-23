import { create } from "zustand";
import type { UserPublic } from "../types";

interface AuthState {
  user: UserPublic | null;
  initialized: boolean;
  setUser: (user: UserPublic | null) => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: () => set({ initialized: true }),
}));
