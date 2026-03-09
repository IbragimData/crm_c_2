"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import s from "./DatePicker.module.scss";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toLocalDateString(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // Monday = 0
  const days: Date[] = [];
  for (let i = 0; i < startPad; i++) {
    days.push(new Date(0));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  id,
  "aria-label": ariaLabel,
  disabled = false,
  className,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!ref.current || !open) {
      setDropdownPosition(null);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [open]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayValue = value ? (() => {
    const d = new Date(value + "T12:00:00");
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  })() : "";

  const handlePrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getDaysInMonth(year, month);

  const handleSelectDay = (d: Date) => {
    if (d.getTime() === 0) return;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const dTime = d.getTime();
    if (min) {
      const minD = new Date(min + "T00:00:00");
      if (dTime < minD.getTime()) return;
    }
    if (max) {
      const maxD = new Date(max + "T23:59:59");
      if (dTime > maxD.getTime()) return;
    }
    onChange(dateStr);
    setOpen(false);
  };

  const today = toLocalDateString(new Date().toISOString());
  const minTime = min ? new Date(min + "T00:00:00").getTime() : null;
  const maxTime = max ? new Date(max + "T23:59:59").getTime() : null;
  const isDayDisabled = (d: Date) => {
    if (d.getTime() === 0) return true;
    if (minTime != null && d.getTime() < minTime) return true;
    if (maxTime != null && d.getTime() > maxTime) return true;
    return false;
  };

  return (
    <div ref={ref} className={`${s.DatePicker} ${className ?? ""}`.trim()}>
      <button
        type="button"
        id={id}
        className={`${s.DatePicker__trigger} ${!displayValue ? s.DatePicker__trigger_placeholder : ""} ${open ? s.DatePicker__trigger_open : ""} ${disabled ? s.DatePicker__trigger_disabled : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{displayValue || placeholder}</span>
        <svg
          className={`${s.DatePicker__chevron} ${open ? s.DatePicker__chevron_open : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      {typeof document !== "undefined" &&
        open &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={s.DatePicker__dropdown}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 99999,
            }}
          >
            <div className={s.DatePicker__nav}>
              <button
                type="button"
                className={s.DatePicker__navBtn}
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className={s.DatePicker__navTitle}>
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                className={s.DatePicker__navBtn}
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className={s.DatePicker__weekdays}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={s.DatePicker__weekday}>
                  {w}
                </span>
              ))}
            </div>
            <div className={s.DatePicker__grid}>
              {days.map((d, i) => {
                const isEmpty = d.getTime() === 0;
                const dateStr = isEmpty ? "" : toLocalDateString(d.toISOString());
                const isSelected = dateStr === value;
                const isToday = dateStr === today;
                const dayDisabled = isEmpty || isDayDisabled(d);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${s.DatePicker__day} ${isEmpty ? s.DatePicker__day_empty : ""} ${isSelected ? s.DatePicker__day_selected : ""} ${isToday ? s.DatePicker__day_today : ""} ${dayDisabled ? s.DatePicker__day_disabled : ""}`}
                    disabled={dayDisabled}
                    onClick={() => handleSelectDay(d)}
                    aria-label={isEmpty ? undefined : d.toLocaleDateString()}
                  >
                    {isEmpty ? "" : d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
