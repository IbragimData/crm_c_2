"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import s from "./DateTimePicker.module.scss";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function clampHour(n: number): number {
  return Math.min(23, Math.max(0, isNaN(n) ? 0 : n));
}
function clampMinute(n: number): number {
  return Math.min(59, Math.max(0, isNaN(n) ? 0 : n));
}

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
  const startPad = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = 0; i < startPad; i++) days.push(new Date(0));
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

/** value/onChange use full ISO string (e.g. 2025-03-15T14:30:00.000Z). Empty string = no value. */
export interface DateTimePickerProps {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
  /** Min datetime as ISO string; past dates/times are disabled */
  min?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  id,
  "aria-label": ariaLabel,
  disabled = false,
  className,
  min,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [hourInput, setHourInput] = useState<string | null>(null);
  const [minuteInput, setMinuteInput] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const valueDate = value ? new Date(value) : null;
  const [viewDate, setViewDate] = useState(() => {
    if (valueDate && !isNaN(valueDate.getTime())) {
      return new Date(valueDate.getFullYear(), valueDate.getMonth(), 1);
    }
    return new Date();
  });

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [value]);

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
      setHourInput(null);
      setMinuteInput(null);
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

  const displayValue = value
    ? (() => {
        try {
          const d = new Date(value);
          if (isNaN(d.getTime())) return "";
          return d.toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        } catch {
          return "";
        }
      })()
    : "";

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const days = getDaysInMonth(currentYear, currentMonth);

  const selectedDateStr = value ? toLocalDateString(value) : "";
  const selectedHour = valueDate && !isNaN(valueDate.getTime()) ? valueDate.getHours() : 12;
  const selectedMinute = valueDate && !isNaN(valueDate.getTime()) ? valueDate.getMinutes() : 0;

  const handlePrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const buildIso = (dateStr: string, hour: number, minute: number): string => {
    const [y, m, day] = dateStr.split("-").map(Number);
    const d = new Date(y, m - 1, day, hour, minute, 0, 0);
    return d.toISOString();
  };

  const handleSelectDay = (d: Date) => {
    if (d.getTime() === 0) return;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const minD = min ? new Date(min) : null;
    let candidateIso = buildIso(dateStr, selectedHour, selectedMinute);
    if (min && minD && new Date(candidateIso).getTime() < minD.getTime()) {
      candidateIso = min;
    }
    onChange(candidateIso);
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const dateStr = selectedDateStr || toLocalDateString(new Date().toISOString());
    let iso = buildIso(dateStr, hour, minute);
    const minD = min ? new Date(min) : null;
    if (min && minD && new Date(iso).getTime() < minD.getTime()) {
      iso = min;
    }
    onChange(iso);
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHourInput(raw);
  };
  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMinuteInput(raw);
  };
  const handleHourBlur = () => {
    const raw = hourInput ?? String(selectedHour).padStart(2, "0");
    const n = clampHour(raw === "" ? 0 : parseInt(raw, 10));
    handleTimeChange(n, selectedMinute);
    setHourInput(null);
  };
  const handleMinuteBlur = () => {
    const raw = minuteInput ?? String(selectedMinute).padStart(2, "0");
    const m = clampMinute(raw === "" ? 0 : parseInt(raw, 10));
    handleTimeChange(selectedHour, m);
    setMinuteInput(null);
  };

  const hourDisplay = hourInput !== null ? hourInput : String(selectedHour).padStart(2, "0");
  const minuteDisplay = minuteInput !== null ? minuteInput : String(selectedMinute).padStart(2, "0");

  const today = toLocalDateString(new Date().toISOString());
  const minDate = min ? new Date(min) : null;
  const minDateStr = minDate && !isNaN(minDate.getTime()) ? toLocalDateString(min) : "";
  const minDayStart = minDate && !isNaN(minDate.getTime()) ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime() : null;
  const isDayDisabled = (d: Date) => {
    if (d.getTime() === 0) return true;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (minDayStart != null && dayStart < minDayStart) return true;
    return false;
  };

  const showMinTimeHint = min && selectedDateStr === minDateStr && minDate && !isNaN(minDate.getTime());
  const minTimeHint = showMinTimeHint && minDate
    ? `${minDate.getHours().toString().padStart(2, "0")}:${minDate.getMinutes().toString().padStart(2, "0")}`
    : null;

  return (
    <div ref={ref} className={`${s.DateTimePicker} ${className ?? ""}`.trim()}>
      <button
        type="button"
        id={id}
        className={`${s.DateTimePicker__trigger} ${!displayValue ? s.DateTimePicker__trigger_placeholder : ""} ${open ? s.DateTimePicker__trigger_open : ""} ${disabled ? s.DateTimePicker__trigger_disabled : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{displayValue || placeholder}</span>
        <svg
          className={`${s.DateTimePicker__chevron} ${open ? s.DateTimePicker__chevron_open : ""}`}
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
            className={s.DateTimePicker__dropdown}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 99999,
            }}
          >
            <div className={s.DateTimePicker__nav}>
              <button
                type="button"
                className={s.DateTimePicker__navBtn}
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className={s.DateTimePicker__navTitle}>
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                className={s.DateTimePicker__navBtn}
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className={s.DateTimePicker__weekdays}>
              {WEEKDAYS.map((w) => (
                <span key={w} className={s.DateTimePicker__weekday}>
                  {w}
                </span>
              ))}
            </div>
            <div className={s.DateTimePicker__grid}>
              {days.map((d, i) => {
                const isEmpty = d.getTime() === 0;
                const dateStr = isEmpty ? "" : toLocalDateString(d.toISOString());
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === today;
                const dayDisabled = isEmpty || isDayDisabled(d);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${s.DateTimePicker__day} ${isEmpty ? s.DateTimePicker__day_empty : ""} ${isSelected ? s.DateTimePicker__day_selected : ""} ${isToday ? s.DateTimePicker__day_today : ""} ${dayDisabled ? s.DateTimePicker__day_disabled : ""}`}
                    disabled={dayDisabled}
                    onClick={() => handleSelectDay(d)}
                    aria-label={isEmpty ? undefined : d.toLocaleDateString()}
                  >
                    {isEmpty ? "" : d.getDate()}
                  </button>
                );
              })}
            </div>
            <div className={s.DateTimePicker__time}>
              <label className={s.DateTimePicker__timeLabel}>Time</label>
              {minTimeHint && (
                <p className={s.DateTimePicker__timeMinHint}>Not earlier than {minTimeHint}</p>
              )}
              <div className={s.DateTimePicker__timeRow}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  className={s.DateTimePicker__timeInput}
                  value={hourDisplay}
                  onChange={handleHourInputChange}
                  onBlur={handleHourBlur}
                  onFocus={() => setHourInput(String(selectedHour).padStart(2, "0"))}
                  aria-label="Hour"
                />
                <span className={s.DateTimePicker__timeSep}>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  className={s.DateTimePicker__timeInput}
                  value={minuteDisplay}
                  onChange={handleMinuteInputChange}
                  onBlur={handleMinuteBlur}
                  onFocus={() => setMinuteInput(String(selectedMinute).padStart(2, "0"))}
                  aria-label="Minute"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
