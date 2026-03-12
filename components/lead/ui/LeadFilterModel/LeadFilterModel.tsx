'use client';

import s from "./LeadFilterModel.module.scss";
import m from "@/components/Modal/Modal.module.scss";
import Image from "next/image";
import iconClose from "../../assets/close.svg";
import { LEAD_STATUS_UI, LeadStatus } from "@/features";
import { DatePicker, Select } from "@/components";
import { useEffect, useState, useMemo } from "react";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";

const ALLOWED_OWNER_ROLES = ["AGENT", "TEAMLEADER", "LEADMANAGER", "ADMIN"];

export interface LeadFiltersState {
  status?: LeadStatus | LeadStatus[];
  dateFrom?: string;
  dateTo?: string;
  leadOwnerId?: string;
  /** Только для лидов команды: true = только лиды, у которых владелец — участник команды */
  leadOwnerInTeam?: boolean;
}

interface Props {
  setFilters: (filters: LeadFiltersState) => void;
  currentFilters: LeadFiltersState;
  isOpen: boolean;
  onClose: () => void;
  hideOwner?: boolean;
  /** If set, owner dropdown shows only these employee IDs (e.g. team members); also shows "Only leads owned by team members" checkbox */
  ownerEmployeeIds?: string[];
}

function toLocalDateString(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

/** Нормализует status в массив выбранных статусов (пустой = "All") */
function toStatusArray(s: LeadStatus | LeadStatus[] | undefined): LeadStatus[] {
  if (s == null) return [];
  return Array.isArray(s) ? [...s] : [s];
}

function statusArraysEqual(a: LeadStatus[], b: LeadStatus[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const x of b) if (!setA.has(x)) return false;
  return true;
}

export function LeadFilterModel({ setFilters, currentFilters, isOpen, onClose, hideOwner, ownerEmployeeIds }: Props) {
  const employees = useEmployeesStore((state) => state.employees);
  const ownerOptions = useMemo(
    () =>
      ownerEmployeeIds != null && ownerEmployeeIds.length > 0
        ? employees.filter((emp) => ownerEmployeeIds.includes(emp.id))
        : employees.filter((emp) => ALLOWED_OWNER_ROLES.includes(emp.role)),
    [employees, ownerEmployeeIds]
  );
  const [statuses, setStatuses] = useState<LeadStatus[]>(() => toStatusArray(currentFilters?.status));
  const [dateFrom, setDateFrom] = useState<string>(() => toLocalDateString(currentFilters?.dateFrom));
  const [dateTo, setDateTo] = useState<string>(() => toLocalDateString(currentFilters?.dateTo));
  const [leadOwnerId, setLeadOwnerId] = useState<string>(currentFilters?.leadOwnerId ?? "");
  const [dateError, setDateError] = useState<string>("");

  const isTeamContext = ownerEmployeeIds != null && ownerEmployeeIds.length > 0;

  useEffect(() => {
    if (isOpen) {
      setStatuses(toStatusArray(currentFilters?.status));
      setDateFrom(toLocalDateString(currentFilters?.dateFrom));
      setDateTo(toLocalDateString(currentFilters?.dateTo));
      setLeadOwnerId(currentFilters?.leadOwnerId ?? "");
      setDateError("");
    }
  }, [isOpen, currentFilters?.status, currentFilters?.dateFrom, currentFilters?.dateTo, currentFilters?.leadOwnerId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const hasChanges = useMemo(() => {
    const cf = currentFilters ?? {};
    const fromOk = !dateFrom || dateFrom === toLocalDateString(cf.dateFrom);
    const toOk = !dateTo || dateTo === toLocalDateString(cf.dateTo);
    const ownerOk = hideOwner || (leadOwnerId || undefined) === cf.leadOwnerId;
    const currentStatuses = toStatusArray(cf.status);
    return !statusArraysEqual(statuses, currentStatuses) || !fromOk || !toOk || !ownerOk;
  }, [statuses, dateFrom, dateTo, leadOwnerId, currentFilters, hideOwner]);

  const validateAndApply = () => {
    setDateError("");
    const from = dateFrom?.trim();
    const to = dateTo?.trim();
    if (from && to) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();
      if (toTime < fromTime) {
        setDateError("End date must be on or after start date.");
        return;
      }
    }
    setFilters({
      status: statuses.length === 0 ? undefined : statuses.length === 1 ? statuses[0] : statuses,
      dateFrom: from ? new Date(from + "T00:00:00").toISOString() : undefined,
      dateTo: to ? new Date(to + "T23:59:59").toISOString() : undefined,
      leadOwnerId: leadOwnerId || undefined,
      ...(isTeamContext && { leadOwnerInTeam: true }),
    });
    onClose();
  };

  const handleClear = () => {
    setStatuses([]);
    setDateFrom("");
    setDateTo("");
    setLeadOwnerId("");
    setDateError("");
    setFilters(isTeamContext ? { leadOwnerInTeam: true } : {});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true" aria-labelledby="lead-filter-title">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden="true" />
      <div className={`${m.Modal__content} ${s.LeadFilterModel__modal}`}>
        <div className={m.Modal__header}>
          <h3 id="lead-filter-title" className={m.Modal__title}>Lead filters</h3>
          <button type="button" className={m.Modal__closeBtn} onClick={onClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>

        <div className={s.LeadFilterModel__body}>
          <div className={s.LeadFilterModel__section}>
            <h4 className={s.LeadFilterModel__sectionTitle}>Status</h4>
            <div className={s.LeadFilterModel__chips}>
              <button
                type="button"
                className={`${s.LeadFilterModel__chip} ${statuses.length === 0 ? s.LeadFilterModel__chipActive : ""}`}
                onClick={() => setStatuses([])}
              >
                All
              </button>
              {Object.values(LeadStatus).map((st) => {
                const ui = LEAD_STATUS_UI[st];
                const isActive = statuses.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    className={`${s.LeadFilterModel__chip} ${isActive ? s.LeadFilterModel__chipActive : ""}`}
                    style={{
                      backgroundColor: isActive && ui ? ui.bg : undefined,
                      color: isActive && ui ? ui.text : undefined,
                      borderColor: isActive && ui ? ui.text : undefined,
                    }}
                    onClick={() => {
                      setStatuses((prev) =>
                        prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
                      );
                    }}
                  >
                    {ui?.label ?? st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={s.LeadFilterModel__section}>
            <h4 className={s.LeadFilterModel__sectionTitle}>Date range</h4>
            <div className={s.LeadFilterModel__dateRow}>
              <label className={s.LeadFilterModel__dateField}>
                <span className={s.LeadFilterModel__dateLabel}>From</span>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="From"
                  aria-label="From date"
                  max={dateTo || undefined}
                  className={s.LeadFilterModel__dateInput}
                />
              </label>
              <label className={s.LeadFilterModel__dateField}>
                <span className={s.LeadFilterModel__dateLabel}>To</span>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="To"
                  aria-label="To date"
                  min={dateFrom || undefined}
                  className={s.LeadFilterModel__dateInput}
                />
              </label>
            </div>
            {dateError && <p className={s.LeadFilterModel__error}>{dateError}</p>}
          </div>

          {!hideOwner && (
            <div className={s.LeadFilterModel__section}>
              <h4 className={s.LeadFilterModel__sectionTitle}>Lead owner</h4>
              <Select
                className={s.LeadFilterModel__select}
                value={leadOwnerId}
                onChange={setLeadOwnerId}
                options={[
                  { value: "", label: ownerEmployeeIds != null ? "All desk members" : "All" },
                  ...ownerOptions.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                  })),
                ]}
                aria-label="Filter by lead owner"
              />
            </div>
          )}
        </div>

        <div className={m.Modal__actions}>
          <button type="button" className={s.LeadFilterModel__clearBtn} onClick={handleClear}>
            Clear all
          </button>
          <button
            type="button"
            className={m.Modal__submit}
            onClick={validateAndApply}
            disabled={!hasChanges}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
