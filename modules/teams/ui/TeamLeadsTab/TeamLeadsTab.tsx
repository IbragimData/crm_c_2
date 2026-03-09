"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { LeadFilterModel, DatePicker, BulkAssignLeadOwnerModel, Select } from "@/components";
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
  /** Общее число лидов команды (из lead-assignments), чтобы подгрузить все при открытии */
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLeadNavigation(leads.map((l) => l.id), "team", teamId || null);
  }, [leads, teamId, setLeadNavigation]);

  useEffect(() => {
    if (openPanel === "team") {
      setTeamLoadTeams(true);
      getTeams()
        .then((list) => setTeams(list.filter((t) => t.isActive)))
        .catch(() => setTeams([]))
        .finally(() => setTeamLoadTeams(false));
    }
  }, [openPanel]);

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

            <div className={toolbarStyles.LeadsPage__ownerWrap}>
              <span className={toolbarStyles.LeadsPage__dateLabelText}>Owner</span>
              <Select
                className={toolbarStyles.LeadsPage__ownerSelect}
                value={filters?.leadOwnerId ?? ""}
                onChange={(v) =>
                  setFilters({
                    ...(filters ?? {}),
                    leadOwnerId: v?.trim() || undefined,
                    leadOwnerInTeam: true,
                  })
                }
                options={[
                  { value: "", label: "All team members" },
                  ...teamMemberEmployees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`,
                  })),
                ]}
                aria-label="Filter by lead owner"
              />
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
                    <div className={selectStyles.Select__dropdown}>
                      {Object.values(LeadStatus).map((st) => {
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
                })}
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
                      <div className={selectStyles.Select__dropdown}>
                        {teamMemberEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            className={`${selectStyles.Select__option} ${toolbarStyles.LeadsPage__dropdownOption}`}
                            disabled={ownerLoading}
                            onClick={() => handleOwnerSelect(emp.id)}
                          >
                            {emp.firstName} {emp.lastName}
                          </button>
                        ))}
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
                      <span>Assign to team</span>
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
                      <div className={selectStyles.Select__dropdown}>
                        {teamLoadTeams ? (
                          <div className={selectStyles.Select__option}>Loading…</div>
                        ) : (
                          teams.map((t) => (
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
          canChangeOwner={isAdmin}
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
