import { create } from "zustand";
import type { AttendanceSession } from "../types";
import {
  startAttendance as apiStartAttendance,
  endAttendance as apiEndAttendance,
  getStoredActiveSession,
  setStoredActiveSession,
} from "../api/attendance.api";

interface AttendanceState {
  currentShift: AttendanceSession | null;
  setCurrentShift: (s: AttendanceSession | null) => void;
  startWork: (employeeId: string, employeeName: string) => Promise<AttendanceSession>;
  finishWork: () => Promise<AttendanceSession | null>;
  hydrate: () => void;
  /** Clear after showing in UI */
  clearError: () => void;
  error: string | null;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  currentShift: null,
  error: null,

  setCurrentShift: (currentShift) => {
    setStoredActiveSession(currentShift);
    set({ currentShift });
  },

  clearError: () => set({ error: null }),

  startWork: async (employeeId, employeeName) => {
    set({ error: null });
    try {
      const session = await apiStartAttendance(employeeId, employeeName);
      set({ currentShift: session });
      return session;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось начать смену на сервере. Проверьте подключение.";
      set({ error: msg });
      throw e;
    }
  },

  finishWork: async () => {
    const { currentShift } = get();
    if (!currentShift) return null;
    set({ error: null });
    try {
      const completed = await apiEndAttendance(currentShift.id, currentShift.employeeId);
      set({ currentShift: null });
      return completed;
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e && typeof (e as any).response?.data?.message === "string"
          ? (e as any).response.data.message
          : e instanceof Error
            ? e.message
            : "Не удалось сохранить конец смены на сервер. Админ не увидит это время.";
      set({ error: msg, currentShift: null });
      setStoredActiveSession(null);
      throw e;
    }
  },

  hydrate: () => {
    const active = getStoredActiveSession();
    if (active) set({ currentShift: active });
    else set({ currentShift: null });
  },
}));
