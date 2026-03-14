"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { LeadFilterModel, DatePicker, BulkAssignLeadOwnerModel } from "@/components";
import { BulkUpdateLeadsStatus } from "@/components/lead/ui/BulkUpdateLeadsStatus";
import iconFilter from "@/modules/lead/assets/filter.svg";
import toolbarStyles from "@/modules/lead/ui/LeadsPage/LeadsPage.module.scss";
import selectStyles from "@/components/Select/Select.module.scss";
import Image from "next/image";
import { LeadsList } from "@/modules";
import { useGetAllLeadsByTeamId } from "@/features/teams/hooks/useGetAllLeadsByTeamId";
import type { TeamLeadsFilters } from "@/features/teams/hooks/useGetAllLeadsByTeamId";
import type { LeadFiltersState } from "@/components/lead/ui/LeadFilterModel/LeadFilterModel";
import { useLeadNavigationStore } from "@/features/lead/store";
import { LeadStatus, LEAD_STATUS_UI } from "@/features";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useBulkUpdateLeadsStatus } from "@/features/lead/hooks/useBulkUpdateLeadsStatus";
import { useBulkAssignLeadOwner } from "@/features/lead/hooks/useBulkAssignLeadOwner";
import { getTeams, bulkAssignLeadsToTeam } from "@/features/teams/api";
import type { TeamMemberApi } from "@/config/api-types";
import s from "./TeamLeadsTab.module.scss";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "TEAMLEADER", "LEADMANAGER"] as const;
const CAN_ASSIGN_TO_TEAM_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

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

function countActiveFilters(f: TeamLeadsFilters): number {
  let n = 0;
  const s = f?.status;
  if (s != null && (Array.isArray(s) ? s.length > 0 : true)) n++;
  if (f?.dateFrom) n++;
  if (f?.dateTo) n++;
  if (f?.leadOwnerId) n++;
  return n;
}

function getSelectedStatuses(f: TeamLeadsFilters | undefined): LeadStatus[] {
  const s = f?.status;
  if (s == null) return [];
  return Array.isArray(s) ? [...s] : [s];
}

function toggleStatusInFilters(filters: TeamLeadsFilters, st: LeadStatus): TeamLeadsFilters {
  const current = getSelectedStatuses(filters);
  const next = current.includes(st) ? current.filter((x) => x !== st) : [...current, st];
  return {
    ...filters,
    status: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
  };
}

function isStatusSelected(filters: TeamLeadsFilters | undefined, st: LeadStatus): boolean {
  const s = filters?.status;
  if (s == null) return false;
  return Array.isArray(s) ? s.includes(st) : s === st;
}

interface TeamLeadsTabProps {
  teamId: string;
  members: TeamMemberApi[];
  /** Total team leads count (from lead-assignments) to load all when opening */
  expectedLeadsTotal?: number;
  activeLeads: string[];
  setActiveLeads: React.Dispatch<React.SetStateAction<string[]>>;
  isOpen: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (e: boolean) => void;
  setIsOpen: (e: boolean) => void;
}

export function TeamLeadsTab({
  teamId,
  members,
  expectedLeadsTotal,
  activeLeads,
  setActiveLeads,
  isOpen,
  setIsOpen,
  isModalOpen,
  setIsModalOpen,
}: TeamLeadsTabProps) {
  const {
    leads,
    setLeads,
    loading,
    page,
    total,
    pageSize,
    setPageSize,
    hasMore,
    goToPage,
    refresh,
    setFilters,
    filters,
  } = useGetAllLeadsByTeamId(teamId || "", expectedLeadsTotal ?? undefined);
  const employees = useEmployeesStore((state) => state.employees);
  const teamMemberEmployeeIds = useMemo(() => members.map((m) => m.employeeId), [members]);
  const teamMemberEmployees = useMemo(
    () => employees.filter((e) => teamMemberEmployeeIds.includes(e.id)),
    [employees, teamMemberEmployeeIds]
  );
  const [openPanel, setOpenPanel] = useState<"status" | "owner" | "team" | null>(null);
  const [statusSearchQuery, setStatusSearchQuery] = useState("");
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [ownerFilterOpen, setOwnerFilterOpen] = useState(false);
  const [ownerFilterSearchQuery, setOwnerFilterSearchQuery] = useState("");
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [dateError, setDateError] = useState<string>("");
  const setLeadNavigation = useLeadNavigationStore((s) => s.setLeadNavigation);
  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);
  const canAssignToTeam = currentUser && CAN_ASSIGN_TO_TEAM_ROLES.includes(currentUser.role as any);
  const activeFilterCount = countActiveFilters(filters ?? {});

  const { assign: assignStatus, loading: statusLoading } = useBulkUpdateLeadsStatus();
  const { assign: assignOwner, loading: ownerLoading } = useBulkAssignLeadOwner();
  const [teams, setTeams] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [teamLoadTeams, setTeamLoadTeams] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  const filteredOwnerEmployees = useMemo(() => {
    const q = ownerSearchQuery.trim().toLowerCase();
    if (!q) return teamMemberEmployees;
    return teamMemberEmployees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q)
    );
  }, [teamMemberEmployees, ownerSearchQuery]);

  const filteredTeams = useMemo(() => {
    const q = teamSearchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, teamSearchQuery]);

  const filteredOwnerFilterOptions = useMemo(() => {
    const q = ownerFilterSearchQuery.trim().toLowerCase();
    if (!q) return teamMemberEmployees;
    return teamMemberEmployees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q)
    );
  }, [teamMemberEmployees, ownerFilterSearchQuery]);

  const selectedOwnerLabel = useMemo(() => {
    const id = filters?.leadOwnerId;
    if (!id) return "All desk members";
    const emp = teamMemberEmployees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "All desk members";
  }, [filters?.leadOwnerId, teamMemberEmployees]);

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
    setLeadNavigation(leads.map((l) => l.id), "team", teamId || null);
  }, [leads, teamId, setLeadNavigation]);

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
    if (ownerFilterOpen) {
      setOwnerFilterSearchQuery("");
      setTimeout(() => ownerFilterSearchInputRef.current?.focus(), 0);
    }
  }, [ownerFilterOpen]);

  useEffect(() => {
    const handleOwnerFilterClickOutside = (e: MouseEvent) => {
      if (ownerFilterRef.current && !ownerFilterRef.current.contains(e.target as Node)) {
        setOwnerFilterOpen(false);
      }
    };
    if (ownerFilterOpen) {
      document.addEventListener("mousedown", handleOwnerFilterClickOutside);
      return () => document.removeEventListener("mousedown", handleOwnerFilterClickOutside);
    }
  }, [ownerFilterOpen]);

  useEffect(() => {
    if (openPanel === "team" && !teamLoadTeams) {
      setTeamSearchQuery("");
      setTimeout(() => teamSearchInputRef.current?.focus(), 0);
    }
  }, [openPanel, teamLoadTeams]);

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

  const handleSingleLeadOwnerChange = useCallback(
    async (leadId: string, newOwnerId: string) => {
      const result = await assignOwner([leadId], newOwnerId);
      if (result) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, leadOwnerId: newOwnerId } : l))
        );
        refresh();
      }
    },
    [assignOwner, setLeads, refresh]
  );

  const handleTeamSelect = useCallback(
    async (targetTeamId: string) => {
      setTeamLoading(true);
      try {
        await bulkAssignLeadsToTeam({ teamId: targetTeamId, leadIds: activeLeads });
        setActiveLeads([]);
        setOpenPanel(null);
        refresh();
      } finally {
        setTeamLoading(false);
      }
    },
    [activeLeads, refresh]
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

  const handleSetFilters = useCallback(
    (next: LeadFiltersState) => {
      setFilters({
        status: next.status,
        dateFrom: next.dateFrom,
        dateTo: next.dateTo,
        leadOwnerId: next.leadOwnerId,
        leadOwnerInTeam: next.leadOwnerInTeam,
      });
    },
    [setFilters]
  );

  if (loading) {
    return (
      <div className={s.root}>
        <div className={s.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.toolbarWrap}>
        <div className={toolbarStyles.LeadsPage__toolbar} ref={dropdownRef}>
          <div className={toolbarStyles.LeadsPage__toolbarRow}>
            <div className={toolbarStyles.LeadsPage__chips}>
              <button
                type="button"
                className={`${toolbarStyles.LeadsPage__chip} ${getSelectedStatuses(filters ?? {}).length === 0 ? toolbarStyles.LeadsPage__chipActive : ""}`}
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
                    className={`${toolbarStyles.LeadsPage__chip} ${isActive ? toolbarStyles.LeadsPage__chipActive : ""}`}
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

            <div className={toolbarStyles.LeadsPage__dateRange}>
              <label className={toolbarStyles.LeadsPage__dateLabel}>
                <span className={toolbarStyles.LeadsPage__dateLabelText}>From</span>
                <DatePicker
                  value={dateFromValue}
                  onChange={(v) => applyDateRange(v, dateToValue)}
                  placeholder="From date"
                  aria-label="Filter from date"
                  className={toolbarStyles.LeadsPage__datePicker}
                />
              </label>
              <label className={toolbarStyles.LeadsPage__dateLabel}>
                <span className={toolbarStyles.LeadsPage__dateLabelText}>To</span>
                <DatePicker
                  value={dateToValue}
                  onChange={(v) => applyDateRange(dateFromValue, v)}
                  placeholder="To date"
                  aria-label="Filter to date"
                  className={toolbarStyles.LeadsPage__datePicker}
                />
              </label>
              {dateError && <span className={toolbarStyles.LeadsPage__dateError}>{dateError}</span>}
            </div>

            <div className={toolbarStyles.LeadsPage__ownerWrap} ref={ownerFilterRef}>
              <span className={toolbarStyles.LeadsPage__dateLabelText}>Owner</span>
              <div className={toolbarStyles.LeadsPage__ownerSelectWrap}>
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
                  <div className={`${selectStyles.Select__dropdown} ${toolbarStyles.LeadsPage__dropdownWithSearch}`}>
                    <input
                      ref={ownerFilterSearchInputRef}
                      type="text"
                      className={toolbarStyles.LeadsPage__dropdownSearch}
                      placeholder="Search owner…"
                      value={ownerFilterSearchQuery}
                      onChange={(e) => setOwnerFilterSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      aria-label="Search owner"
                    />
                    <div className={toolbarStyles.LeadsPage__dropdownList}>
                      <button
                        type="button"
                        className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__dropdownOption} ${!filters?.leadOwnerId ? selectStyles.Select__option_selected : ""}`}
                        onClick={() => {
                          setFilters({
                            ...(filters ?? {}),
                            leadOwnerId: undefined,
                            leadOwnerInTeam: true,
                          });
                          setOwnerFilterOpen(false);
                        }}
                      >
                        All desk members
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
                            className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__dropdownOption} ${filters?.leadOwnerId === emp.id ? selectStyles.Select__option_selected : ""}`}
                            onClick={() => {
                              setFilters({
                                ...(filters ?? {}),
                                leadOwnerId: emp.id,
                                leadOwnerInTeam: true,
                              });
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

            <button
              type="button"
              className={toolbarStyles.LeadsPage__filterBtn}
              onClick={() => setIsFiltersModalOpen(true)}
              aria-label={activeFilterCount > 0 ? `Filters active (${activeFilterCount})` : "Open filters"}
            >
              <Image src={iconFilter} width={18} height={18} alt="" aria-hidden />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className={toolbarStyles.LeadsPage__filterBadge}>{activeFilterCount}</span>
              )}
            </button>

            {activeLeads.length > 0 && (
              <div className={toolbarStyles.LeadsPage__actionWrap}>
                  <button
                    type="button"
                    className={`${toolbarStyles.LeadsPage__filterBtn} ${toolbarStyles.LeadsPage__filterBtn_withChevron} ${openPanel === "status" ? toolbarStyles.LeadsPage__filterBtnActive : ""}`}
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
                    <div className={`${selectStyles.Select__dropdown} ${toolbarStyles.LeadsPage__dropdownWithSearch}`}>
                      <input
                        ref={statusSearchInputRef}
                        type="text"
                        className={toolbarStyles.LeadsPage__dropdownSearch}
                        placeholder="Search status…"
                        value={statusSearchQuery}
                        onChange={(e) => setStatusSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label="Search status"
                      />
                      <div className={toolbarStyles.LeadsPage__dropdownList}>
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
                                className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__statusOption}`}
                                disabled={statusLoading}
                                onClick={() => handleStatusSelect(st)}
                              >
                                <span
                                  className={toolbarStyles.LeadsPage__statusChip}
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
            {activeLeads.length > 0 && isAdmin && (
              <div className={toolbarStyles.LeadsPage__actionWrap}>
                    <button
                      type="button"
                      className={`${toolbarStyles.LeadsPage__filterBtn} ${toolbarStyles.LeadsPage__filterBtn_withChevron} ${openPanel === "owner" ? toolbarStyles.LeadsPage__filterBtnActive : ""}`}
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
                      <div className={`${selectStyles.Select__dropdown} ${toolbarStyles.LeadsPage__dropdownWithSearch}`}>
                        <input
                          ref={ownerSearchInputRef}
                          type="text"
                          className={toolbarStyles.LeadsPage__dropdownSearch}
                          placeholder="Search by name…"
                          value={ownerSearchQuery}
                          onChange={(e) => setOwnerSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-label="Search owner"
                        />
                        <div className={toolbarStyles.LeadsPage__dropdownList}>
                          {filteredOwnerEmployees.length === 0 ? (
                            <div className={selectStyles.Select__empty}>
                              {ownerSearchQuery.trim() ? "No matching owners" : "No owners"}
                            </div>
                          ) : (
                            filteredOwnerEmployees.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__dropdownOption}`}
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
                  <div className={toolbarStyles.LeadsPage__actionWrap}>
                <button
                  type="button"
                      className={`${toolbarStyles.LeadsPage__filterBtn} ${toolbarStyles.LeadsPage__filterBtn_withChevron} ${openPanel === "team" ? toolbarStyles.LeadsPage__filterBtnActive : ""}`}
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
                      <div className={`${selectStyles.Select__dropdown} ${toolbarStyles.LeadsPage__dropdownWithSearch}`}>
                        <input
                          ref={teamSearchInputRef}
                          type="text"
                          className={toolbarStyles.LeadsPage__dropdownSearch}
                          placeholder="Search team…"
                          value={teamSearchQuery}
                          onChange={(e) => setTeamSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          aria-label="Search team"
                        />
                        <div className={toolbarStyles.LeadsPage__dropdownList}>
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
                                className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__dropdownOption}`}
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
      </div>

      <LeadFilterModel
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        setFilters={handleSetFilters}
        currentFilters={filters ?? {}}
        ownerEmployeeIds={teamMemberEmployeeIds}
        hideOwner={true}
      />

      <div className={s.listWrap}>
        <LeadsList
          setActiveLeads={setActiveLeads}
          activeLeads={activeLeads}
          leads={leads}
          page={page}
          total={total}
          pageSize={pageSize}
          hasMore={hasMore}
          onGoToPage={goToPage}
          onPageSizeChange={setPageSize}
          canChangeOwner={isAdmin ?? undefined}
          ownerOptions={teamMemberEmployees}
          onOwnerChange={handleSingleLeadOwnerChange}
          ownerChangeLoading={ownerLoading}
        />
      </div>

      <BulkUpdateLeadsStatus
        setLeads={setLeads}
        setActiveLeads={setActiveLeads}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        leadIds={activeLeads}
      />
      <BulkAssignLeadOwnerModel
        setActiveLeads={setActiveLeads}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadIds={activeLeads}
        restrictToEmployeeIds={teamMemberEmployeeIds}
      />
    </div>
  );
}
