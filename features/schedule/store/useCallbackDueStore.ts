"use client";

import { create } from "zustand";
import { getDueSchedules } from "../api/schedules.api";
import type { CallbackSchedule } from "../types/schedule.types";

const POLL_INTERVAL_MS = 15 * 1000; // 15 sec
const FIRST_FETCH_DELAY_MS = 200;

interface CallbackDueState {
  dueCallbacks: CallbackSchedule[];
  loading: boolean;
  _intervalId: ReturnType<typeof setInterval> | null;
  _timeoutId: ReturnType<typeof setTimeout> | null;
  fetchDue: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useCallbackDueStore = create<CallbackDueState>((set, get) => ({
  dueCallbacks: [],
  loading: false,
  _intervalId: null,
  _timeoutId: null,

  fetchDue: async () => {
    if (typeof window === "undefined") return;
    set({ loading: true });
    try {
      const list = await getDueSchedules();
      set({ dueCallbacks: list });
    } catch {
      set({ dueCallbacks: [] });
    } finally {
      set({ loading: false });
    }
  },

  startPolling: () => {
    const { _intervalId, _timeoutId } = get();
    if (_intervalId ?? _timeoutId) return;

    const run = () => get().fetchDue();

    const timeoutId = setTimeout(() => {
      run();
      const intervalId = setInterval(run, POLL_INTERVAL_MS);
      set({ _intervalId: intervalId, _timeoutId: null });
    }, FIRST_FETCH_DELAY_MS);

    set({ _timeoutId: timeoutId });
  },

  stopPolling: () => {
    const { _intervalId, _timeoutId } = get();
    if (_timeoutId) {
      clearTimeout(_timeoutId);
      set({ _timeoutId: null });
    }
    if (_intervalId) {
      clearInterval(_intervalId);
      set({ _intervalId: null });
    }
  },
}));
