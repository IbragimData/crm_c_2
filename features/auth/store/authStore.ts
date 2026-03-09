import { create } from "zustand";
import { Employee } from "../types"


interface AuthState {
  employee: Employee | null;
  isAuthChecked: boolean;
  setEmployee: (employee: Employee | null) => void;
  setAuthChecked: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employee: null,
  isAuthChecked: false,

  setEmployee: (employee) => set({ employee }),
  setAuthChecked: (v) => set({ isAuthChecked: v }),

  logout: () => {
    localStorage.removeItem("token");
    set({ employee: null });
  },
}));

