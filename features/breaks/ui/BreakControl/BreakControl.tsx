"use client";

import { useState, useRef, useEffect } from "react";
import { useBreaksStore } from "../../store/useBreaksStore";
import { getBreaksStatus } from "../../api/breaks.api";
import { BREAK_TYPE, BREAK_TYPE_LABELS } from "../../types";
import type { BreakType } from "../../types";
import s from "./BreakControl.module.scss";

interface BreakControlProps {
  employeeId: string;
  employeeName: string;
}

const BREAK_TYPES: BreakType[] = [BREAK_TYPE.FIRST_BREAK, BREAK_TYPE.SECOND_BREAK, BREAK_TYPE.LUNCH];

export function BreakControl({ employeeId, employeeName }: BreakControlProps) {
  const [open, setOpen] = useState(false);
  const [takenThisShift, setTakenThisShift] = useState<BreakType[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const startBreak = useBreaksStore((s) => s.startBreak);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    getBreaksStatus()
      .then((status) => setTakenThisShift(status.breaksTakenThisShift ?? []))
      .catch(() => setTakenThisShift([]));
  }, [open]);

  const handleStartBreak = async (breakType: BreakType) => {
    try {
      await startBreak(employeeId, employeeName, breakType);
      setTakenThisShift((prev) => (prev.includes(breakType) ? prev : [...prev, breakType]));
      setOpen(false);
    } catch {
      // Error shown in header
    }
  };

  return (
    <div className={s.breakControl} ref={ref}>
      <button
        type="button"
        className={s.breakControl__trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Go on break"
      >
        <span className={s.breakControl__label}>Break</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={s.breakControl__dropdown}>
          {BREAK_TYPES.map((breakType) => {
            const taken = takenThisShift.includes(breakType);
            return (
              <button
                key={breakType}
                type="button"
                className={s.breakControl__option}
                onClick={() => !taken && handleStartBreak(breakType)}
                disabled={taken}
                title={taken ? "Already taken this shift" : undefined}
              >
                {BREAK_TYPE_LABELS[breakType]}
                {taken && <span className={s.breakControl__taken}> (taken)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
