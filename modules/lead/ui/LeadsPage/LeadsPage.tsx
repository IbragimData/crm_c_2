"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HeaderPage, LeadFilterModel, DatePicker } from "@/components";
import iconAdd from "../../assets/add.svg";
import iconFilter from "../../assets/filter.svg";
import s from "./LeadsPage.module.scss";
import selectStyles from "@/components/Select/Select.module.scss";
import Image from "next/image";
import { LeadsList } from "@/modules";
import { useLeads } from "../../../../features/lead/hooks";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useLeadNavigationStore, useLeadsStore } from "@/features/lead/store";
import { LeadStatus, LEAD_STATUS_UI } from "@/features";
import type { LeadsFilters } from "@/features";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { useBulkUpdateLeadsStatus } from "@/features/lead/hooks/useBulkUpdateLeadsStatus";
import { useBulkAssignLeadOwner } from "@/features/lead/hooks/useBulkAssignLeadOwner";
import { getTeams, bulkAssignLeadsToTeam } from "@/features/teams/api";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "TEAMLEADER", "LEADMANAGER"] as const;

/** Роли, которые показываются в фильтре Owner: все кроме USER, AFFILIATOR, SUPER_ADMIN */
const OWNER_FILTER_ROLES = ["AGENT", "TEAMLEADER", "LEADMANAGER", "ADMIN"] as const;

const QUICK_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.IN_PROGRESS,
  LeadStatus.DEPOSITED,
  LeadStatus.NOT_INTERESTED,
  LeadStatus.CALL_BACK,
  LeadStatus.HIGH_POTENTIAL,
];

function toLocalDateString(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function countActiveFilters(f: LeadsFilters, includeOwner = true): number {
  let n = 0;
  const statusVal = f?.status;
  if (statusVal != null && (Array.isArray(statusVal) ? statusVal.length > 0 : true)) n++;
  if (f?.dateFrom) n++;
  if (f?.dateTo) n++;
  if (includeOwner && f?.leadOwnerId) n++;
  return n;
}

/** Текущие выбранные статусы из filters (массив, может быть пустым) */
function getSelectedStatuses(f: LeadsFilters | undefined): LeadStatus[] {
  const s = f?.status;
  if (s == null) return [];
  return Array.isArray(s) ? [...s] : [s];
}

/** Переключить статус в списке фильтров */
function toggleStatusInFilters(filters: LeadsFilters, st: LeadStatus): LeadsFilters {
  const current = getSelectedStatuses(filters);
  const next = current.includes(st) ? current.filter((x) => x !== st) : [...current, st];
  return {
    ...filters,
    status: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
  };
}

function isStatusSelected(filters: LeadsFilters | undefined, st: LeadStatus): boolean {
  const s = filters?.status;
  if (s == null) return false;
  return Array.isArray(s) ? s.includes(st) : s === st;
}

export function LeadsPage() {
  const router = useRouter();
  const { leads, setLeads, loading, page, total, pageSize, hasMore, goToPage, setFilters, filters } = useLeads();
  const employees = useEmployeesStore((state) => state.employees);
  const [activeLeads, setActiveLeads] = useState<string[]>([]);
  const [openPanel, setOpenPanel] = useState<"status" | "owner" | "team" | null>(null);
  const [statusSearchQuery, setStatusSearchQuery] = useState("");
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [ownerFilterOpen, setOwnerFilterOpen] = useState(false);
  const [ownerFilterSearchQuery, setOwnerFilterSearchQuery] = useState("");
  const [dateError, setDateError] = useState<string>("");
  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin =
    currentUser && ADMIN_ROLES.includes(currentUser.role as any);
  const canAssignToTeam = currentUser && ["ADMIN", "SUPER_ADMIN"].includes(currentUser.role as string);
  /** Assign Lead Owner — only LEADMANAGER, ADMIN, SUPER_ADMIN (not TEAMLEADER, not AGENT) */
  const canAssignLeadOwner = currentUser && ["ADMIN", "SUPER_ADMIN", "LEADMANAGER"].includes(currentUser.role as string);
  /** Owner filter (All / employees) — only for ADMIN, SUPER_ADMIN, LEADMANAGER; hidden for agents and team leaders */
  const showOwnerFilter = currentUser && ["ADMIN", "SUPER_ADMIN", "LEADMANAGER"].includes(currentUser.role as string);

  const setLeadNavigation = useLeadNavigationStore((s) => s.setLeadNavigation);
  const loadLeads = useLeadsStore((s) => s.loadLeads);
  const activeFilterCount = countActiveFilters(filters ?? {}, !!showOwnerFilter);
  const ownerFilterOptions = useMemo(
    () => employees.filter((emp) => OWNER_FILTER_ROLES.includes(emp.role as (typeof OWNER_FILTER_ROLES)[number])),
    [employees]
  );

  const filteredOwnerFilterOptions = useMemo(() => {
    const q = ownerFilterSearchQuery.trim().toLowerCase();
    if (!q) return ownerFilterOptions;
    return ownerFilterOptions.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q)
    );
  }, [ownerFilterOptions, ownerFilterSearchQuery]);

  const selectedOwnerLabel = useMemo(() => {
    const id = filters?.leadOwnerId;
    if (!id) return "All";
    const emp = ownerFilterOptions.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "All";
  }, [filters?.leadOwnerId, ownerFilterOptions]);

  // Panel: Update Status
  const { assign: assignStatus, loading: statusLoading } = useBulkUpdateLeadsStatus();

  // Panel: Assign Owner — only LEADMANAGER, ADMIN, SUPER_ADMIN
  const { assign: assignOwner, loading: ownerLoading } = useBulkAssignLeadOwner();
  const allowedRoles = ["AGENT", "TEAMLEADER"];
  const agentAndTeamleaderEmployees = employees.filter((emp) => allowedRoles.includes(emp.role));

  // Panel: Assign to Team (state before useMemo that depends on teams)
  const [teams, setTeams] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [teamLoadTeams, setTeamLoadTeams] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  const filteredOwnerEmployees = useMemo(() => {
    const q = ownerSearchQuery.trim().toLowerCase();
    if (!q) return agentAndTeamleaderEmployees;
    return agentAndTeamleaderEmployees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q)
    );
  }, [agentAndTeamleaderEmployees, ownerSearchQuery]);

  const filteredTeams = useMemo(() => {
    const q = teamSearchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, teamSearchQuery]);

  const filteredStatuses = useMemo(() => {
    const q = statusSearchQuery.trim().toLowerCase();
    const all = Object.values(LeadStatus);
    if (!q) return all;
    return all.filter((st) => LEAD_STATUS_UI[st].label.toLowerCase().includes(q));
  }, [statusSearchQuery]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusSearchInputRef = useRef<HTMLInputElement>(null);
  const ownerSearchInputRef = useRef<HTMLInputElement>(null);
  const teamSearchInputRef = useRef<HTMLInputElement>(null);
  const ownerFilterRef = useRef<HTMLDivElement>(null);
  const ownerFilterSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openPanel === "team") {
      setTeamLoadTeams(true);
      setTeamSearchQuery("");
      getTeams()
        .then((list) => setTeams(list.filter((t) => t.isActive)))
        .catch(() => setTeams([]))
        .finally(() => setTeamLoadTeams(false));
    }
  }, [openPanel]);

  useEffect(() => {
    if (openPanel === "owner") {
      setOwnerSearchQuery("");
      setTimeout(() => ownerSearchInputRef.current?.focus(), 0);
    }
  }, [openPanel]);

  useEffect(() => {
    if (openPanel === "status") {
      setStatusSearchQuery("");
      setTimeout(() => statusSearchInputRef.current?.focus(), 0);
    }
  }, [openPanel]);

  useEffect(() => {
    if (openPanel === "team" && !teamLoadTeams) {
      setTeamSearchQuery("");
      setTimeout(() => teamSearchInputRef.current?.focus(), 0);
    }
  }, [openPanel, teamLoadTeams]);

  useEffect(() => {
    if (ownerFilterOpen) {
      setOwnerFilterSearchQuery("");
      setTimeout(() => ownerFilterSearchInputRef.current?.focus(), 0);
    }
  }, [ownerFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ownerFilterRef.current && !ownerFilterRef.current.contains(e.target as Node)) {
        setOwnerFilterOpen(false);
      }
    };
    if (ownerFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [ownerFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    if (openPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openPanel]);

  const handleStatusSelect = useCallback(
    async (st: LeadStatus) => {
      const result = await assignStatus(activeLeads, st);
      if (result) {
        setLeads((prev) =>
          prev.map((lead) => (activeLeads.includes(lead.id) ? { ...lead, status: st } : lead))
        );
        setActiveLeads([]);
        setOpenPanel(null);
      }
    },
    [activeLeads, assignStatus, setLeads]
  );

  const handleOwnerSelect = useCallback(
    async (employeeId: string) => {
      const result = await assignOwner(activeLeads, employeeId);
      if (result) {
        setActiveLeads([]);
        setOpenPanel(null);
      }
    },
    [activeLeads, assignOwner]
  );

  const handleTeamSelect = useCallback(
    async (teamId: string) => {
      setTeamLoading(true);
      try {
        await bulkAssignLeadsToTeam({ teamId, leadIds: activeLeads });
        setActiveLeads([]);
        setOpenPanel(null);
        loadLeads(true);
      } finally {
        setTeamLoading(false);
      }
    },
    [activeLeads, loadLeads]
  );

  const dateFromValue = toLocalDateString(filters?.dateFrom);
  const dateToValue = toLocalDateString(filters?.dateTo);

  const applyDateRange = useCallback(
    (from: string, to: string) => {
      setDateError("");
      const fromTrim = from.trim();
      const toTrim = to.trim();
      if (fromTrim && toTrim) {
        const fromTime = new Date(fromTrim).getTime();
        const toTime = new Date(toTrim).getTime();
        if (toTime < fromTime) {
          setDateError("To date must be ≥ From date");
          return;
        }
      }
      setFilters({
        ...(filters ?? {}),
        dateFrom: fromTrim ? new Date(fromTrim + "T00:00:00").toISOString() : undefined,
        dateTo: toTrim ? new Date(toTrim + "T23:59:59").toISOString() : undefined,
      });
    },
    [filters, setFilters]
  );

  useEffect(() => {
    setLeadNavigation(leads.map((l) => l.id), "leads");
  }, [leads, setLeadNavigation]);

  if (loading) {
    return <div className={s.LeadsPage}>Loading...</div>;
  }

  return (
    <div className={s.LeadsPage}>
      <HeaderPage
        title="Leads"
        icon={<Image src={iconAdd} width={14} height={14} alt="add" />}
        label="Add Lead"
        backgroundColor="var(--color-btn-primary-bg)"
        color="var(--color-btn-primary-text)"
        iconPosition="left"
        onClick={() => router.push("/leads/create")}
      />

      {/* Toolbar: один ряд — чипы, даты, Owner, Filters, кнопки действий по одной */}
      <div className={s.LeadsPage__toolbar} ref={dropdownRef}>
        <div className={s.LeadsPage__toolbarRow}>
          <div className={s.LeadsPage__chips}>
            <button
              type="button"
              className={`${s.LeadsPage__chip} ${getSelectedStatuses(filters ?? {}).length === 0 ? s.LeadsPage__chipActive : ""}`}
              onClick={() => setFilters({ ...(filters ?? {}), status: undefined })}
            >
              All
            </button>
            {QUICK_STATUSES.map((st) => {
              const ui = LEAD_STATUS_UI[st];
              const isActive = isStatusSelected(filters, st);
              return (
                <button
                  key={st}
                  type="button"
                  className={`${s.LeadsPage__chip} ${isActive ? s.LeadsPage__chipActive : ""}`}
                  style={{
                    backgroundColor: isActive ? ui.bg : "var(--lead-chip-bg)",
                    color: isActive ? ui.text : "var(--lead-chip-text)",
                    borderColor: isActive ? ui.text : "var(--lead-chip-border)",
                  }}
                  onClick={() => setFilters(toggleStatusInFilters(filters ?? {}, st))}
                >
                  {ui.label}
                </button>
              );
            })}
          </div>

          <div className={s.LeadsPage__dateRange}>
            <label className={s.LeadsPage__dateLabel}>
              <span className={s.LeadsPage__dateLabelText}>From</span>
              <DatePicker
                value={dateFromValue}
                onChange={(v) => {
                  const to = dateToValue;
                  applyDateRange(v, to);
                }}
                placeholder="From date"
                aria-label="Filter from date"
                className={s.LeadsPage__datePicker}
              />
            </label>
            <label className={s.LeadsPage__dateLabel}>
              <span className={s.LeadsPage__dateLabelText}>To</span>
              <DatePicker
                value={dateToValue}
                onChange={(v) => {
                  const from = dateFromValue;
                  applyDateRange(from, v);
                }}
                placeholder="To date"
                aria-label="Filter to date"
                className={s.LeadsPage__datePicker}
              />
            </label>
            {dateError && <span className={s.LeadsPage__dateError}>{dateError}</span>}
          </div>

          {showOwnerFilter && (
            <div className={s.LeadsPage__ownerWrap} ref={ownerFilterRef}>
              <span className={s.LeadsPage__dateLabelText}>Owner</span>
              <div className={s.LeadsPage__ownerSelectWrap}>
                <button
                  type="button"
                  className={`${selectStyles.Select__trigger} ${ownerFilterOpen ? selectStyles.Select__trigger_open : ""}`}
                  onClick={() => setOwnerFilterOpen((o) => !o)}
                  aria-label="Filter by lead owner"
                  aria-expanded={ownerFilterOpen}
                >
                  <span>{selectedOwnerLabel}</span>
                  <svg
                    className={`${selectStyles.Select__chevron} ${ownerFilterOpen ? selectStyles.Select__chevron_open : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {ownerFilterOpen && (
                  <div className={`${selectStyles.Select__dropdown} ${s.LeadsPage__dropdownWithSearch}`}>
                    <input
                      ref={ownerFilterSearchInputRef}
                      type="text"
                      className={s.LeadsPage__dropdownSearch}
                      placeholder="Search owner…"
                      value={ownerFilterSearchQuery}
                      onChange={(e) => setOwnerFilterSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      aria-label="Search owner"
                    />
                    <div className={s.LeadsPage__dropdownList}>
                      <button
                        type="button"
                        className={`${selectStyles.Select__option} ${s.LeadsPage__dropdownOption} ${!filters?.leadOwnerId ? selectStyles.Select__option_selected : ""}`}
                        onClick={() => {
                          setFilters({ ...(filters ?? {}), leadOwnerId: undefined });
                          setOwnerFilterOpen(false);
                        }}
                      >
                        All
                      </button>
                      {filteredOwnerFilterOptions.length === 0 ? (
                        ownerFilterSearchQuery.trim() ? (
                          <div className={selectStyles.Select__empty}>No matching owners</div>
                        ) : null
                      ) : (
                        filteredOwnerFilterOptions.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            className={`${selectStyles.Select__option} ${s.LeadsPage__dropdownOption} ${filters?.leadOwnerId === emp.id ? selectStyles.Select__option_selected : ""}`}
                            onClick={() => {
                              setFilters({ ...(filters ?? {}), leadOwnerId: emp.id });
                              setOwnerFilterOpen(false);
                            }}
                          >
                            {emp.firstName} {emp.lastName}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            className={s.LeadsPage__filterBtn}
            onClick={() => setIsFiltersModalOpen(true)}
            aria-label={activeFilterCount > 0 ? `Filters active (${activeFilterCount})` : "Open filters"}
          >
            <Image src={iconFilter} width={18} height={18} alt="" aria-hidden />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={s.LeadsPage__filterBadge}>{activeFilterCount}</span>
            )}
          </button>

          {activeLeads.length > 0 && (
            <div className={s.LeadsPage__actionWrap}>
              <button
                type="button"
                className={`${s.LeadsPage__filterBtn} ${s.LeadsPage__filterBtn_withChevron} ${openPanel === "status" ? s.LeadsPage__filterBtnActive : ""}`}
                onClick={() => setOpenPanel(openPanel === "status" ? null : "status")}
              >
                <span>Update Status</span>
                <svg
                  className={`${selectStyles.Select__chevron} ${openPanel === "status" ? selectStyles.Select__chevron_open : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openPanel === "status" && (
                <div className={`${selectStyles.Select__dropdown} ${s.LeadsPage__dropdownWithSearch}`}>
                  <input
                    ref={statusSearchInputRef}
                    type="text"
                    className={s.LeadsPage__dropdownSearch}
                    placeholder="Search status…"
                    value={statusSearchQuery}
                    onChange={(e) => setStatusSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label="Search status"
                  />
                  <div className={s.LeadsPage__dropdownList}>
                    {filteredStatuses.length === 0 ? (
                      <div className={selectStyles.Select__empty}>
                        {statusSearchQuery.trim() ? "No matching statuses" : "No statuses"}
                      </div>
                    ) : (
                      filteredStatuses.map((st) => {
                        const ui = LEAD_STATUS_UI[st];
                        return (
                          <button
                            key={st}
                            type="button"
                            className={`${selectStyles.Select__option} ${s.LeadsPage__statusOption}`}
                            disabled={statusLoading}
                            onClick={() => handleStatusSelect(st)}
                          >
                            <span
                              className={s.LeadsPage__statusChip}
                              style={{ backgroundColor: ui.bg, color: ui.text }}
                              aria-hidden
                            />
                            <span>{ui.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeLeads.length > 0 && canAssignLeadOwner && (
            <div className={s.LeadsPage__actionWrap}>
              <button
                type="button"
                className={`${s.LeadsPage__filterBtn} ${s.LeadsPage__filterBtn_withChevron} ${openPanel === "owner" ? s.LeadsPage__filterBtnActive : ""}`}
                onClick={() => setOpenPanel(openPanel === "owner" ? null : "owner")}
              >
                <span>Assign Lead Owner</span>
                <svg
                  className={`${selectStyles.Select__chevron} ${openPanel === "owner" ? selectStyles.Select__chevron_open : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openPanel === "owner" && (
                <div className={`${selectStyles.Select__dropdown} ${s.LeadsPage__dropdownWithSearch}`}>
                  <input
                    ref={ownerSearchInputRef}
                    type="text"
                    className={s.LeadsPage__dropdownSearch}
                    placeholder="Search by name…"
                    value={ownerSearchQuery}
                    onChange={(e) => setOwnerSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label="Search owner"
                  />
                  <div className={s.LeadsPage__dropdownList}>
                    {filteredOwnerEmployees.length === 0 ? (
                      <div className={selectStyles.Select__empty}>
                        {ownerSearchQuery.trim() ? "No matching owners" : "No owners"}
                      </div>
                    ) : (
                      filteredOwnerEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          className={`${selectStyles.Select__option} ${s.LeadsPage__dropdownOption}`}
                          disabled={ownerLoading}
                          onClick={() => handleOwnerSelect(emp.id)}
                        >
                          {emp.firstName} {emp.lastName}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeLeads.length > 0 && canAssignToTeam && (
            <div className={s.LeadsPage__actionWrap}>
              <button
                type="button"
                className={`${s.LeadsPage__filterBtn} ${s.LeadsPage__filterBtn_withChevron} ${openPanel === "team" ? s.LeadsPage__filterBtnActive : ""}`}
                onClick={() => setOpenPanel(openPanel === "team" ? null : "team")}
              >
                <span>Assign to desk</span>
                <svg
                  className={`${selectStyles.Select__chevron} ${openPanel === "team" ? selectStyles.Select__chevron_open : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openPanel === "team" && (
                <div className={`${selectStyles.Select__dropdown} ${s.LeadsPage__dropdownWithSearch}`}>
                  <input
                    ref={teamSearchInputRef}
                    type="text"
                    className={s.LeadsPage__dropdownSearch}
                    placeholder="Search team…"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label="Search team"
                  />
                  <div className={s.LeadsPage__dropdownList}>
                    {teamLoadTeams ? (
                      <div className={selectStyles.Select__option}>Loading…</div>
                    ) : filteredTeams.length === 0 ? (
                      <div className={selectStyles.Select__empty}>
                        {teamSearchQuery.trim() ? "No matching teams" : "No teams"}
                      </div>
                    ) : (
                      filteredTeams.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`${selectStyles.Select__option} ${s.LeadsPage__dropdownOption}`}
                          disabled={teamLoading}
                          onClick={() => handleTeamSelect(t.id)}
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <LeadFilterModel
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        setFilters={setFilters}
        currentFilters={filters ?? {}}
        hideOwner={!showOwnerFilter}
      />

      <div className={s.LeadsPage__listWrap}>
        <LeadsList
          setActiveLeads={setActiveLeads}
          activeLeads={activeLeads}
          leads={leads}
          page={page}
          total={total}
          pageSize={pageSize}
          hasMore={hasMore}
          onGoToPage={goToPage}
        />
      </div>
    </div>
  );
}
