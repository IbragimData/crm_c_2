"use client";

import { useRef, useEffect, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import s from "./Select.module.scss";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`${s.Select__chevron} ${open ? s.Select__chevron_open : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function Select({
  value,
  onChange,
  options,
  placeholder = "— Select —",
  disabled = false,
  id,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isPlaceholder = !selectedOption;

  const updatePosition = useCallback(() => {
    if (!ref.current || !open) {
      setDropdownPosition(null);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
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
      if (ref.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`${s.Select} ${className ?? ""}`.trim()}>
      <button
        type="button"
        id={id}
        className={`${s.Select__trigger} ${isPlaceholder ? s.Select__trigger_placeholder : ""} ${open ? s.Select__trigger_open : ""} ${disabled ? s.Select__trigger_disabled : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{displayLabel}</span>
        <Chevron open={open} />
      </button>
      {typeof document !== "undefined" &&
        open &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={s.Select__dropdown}
            role="listbox"
            aria-activedescendant={value ? `option-${value}` : undefined}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: dropdownPosition.width,
              zIndex: 99999,
            }}
          >
            {options.length === 0 ? (
              <div className={s.Select__empty}>No options</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  id={value === opt.value ? `option-${opt.value}` : undefined}
                  aria-selected={value === opt.value}
                  className={`${s.Select__option} ${value === opt.value ? s.Select__option_selected : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
