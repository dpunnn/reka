import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "anggota" | "pengurus" | "kasir" | "pembeli" | "pemkab";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
  setSession: (accessToken: string, refreshToken: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      setSession: (accessToken, refreshToken, role) =>
        set({ accessToken, refreshToken, role }),
      logout: () => set({ accessToken: null, refreshToken: null, role: null }),
    }),
    { name: "reka-auth" }
  )
);
