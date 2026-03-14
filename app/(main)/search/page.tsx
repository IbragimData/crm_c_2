"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import s from "./search.module.scss";
import toolbarStyles from "@/modules/lead/ui/LeadsPage/LeadsPage.module.scss";
import selectStyles from "@/components/Select/Select.module.scss";
import { useSearchLeads, type SearchFilters } from "@/features/lead/hooks/useSearchLead";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { LeadsList } from "@/modules";
import { BulkAssignLeadOwnerModel, ButtonComponentDefault, DatePicker } from "@/components";
import { BulkUpdateLeadsStatus } from "@/components/lead/ui/BulkUpdateLeadsStatus";
import { LeadStatus, LEAD_STATUS_UI } from "@/features";
import type { LeadStatus as LeadStatusType } from "@/features/lead/types/lead";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "TEAMLEADER", "LEADMANAGER"] as const;
const OWNER_FILTER_ROLES = ["AGENT", "TEAMLEADER", "LEADMANAGER", "ADMIN"] as const;
const QUICK_STATUSES: LeadStatusType[] = [
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
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function getSelectedStatuses(f: SearchFilters | undefined): LeadStatusType[] {
  const st = f?.status;
  if (st == null) return [];
  return Array.isArray(st) ? [...st] : [st];
}

function toggleStatusInFilters(filters: SearchFilters, st: LeadStatusType): SearchFilters {
  const current = getSelectedStatuses(filters);
  const next = current.includes(st)
    ? current.filter((x) => x !== st)
    : [...current, st];
  return {
    ...filters,
    status: next.length === 0 ? undefined : next.length === 1 ? next[0] : next,
  };
}

function isStatusSelected(filters: SearchFilters | undefined, st: LeadStatusType): boolean {
  const s = filters?.status;
  if (s == null) return false;
  return Array.isArray(s) ? s.includes(st) : s === st;
}

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryFromUrl = (searchParams.get("query") || "").trim();
    const observerTarget = useRef<HTMLDivElement>(null);
    const ownerFilterRef = useRef<HTMLDivElement>(null);
    const [activeLeads, setActiveLeads] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [ownerFilterOpen, setOwnerFilterOpen] = useState(false);
    const [ownerFilterSearchQuery, setOwnerFilterSearchQuery] = useState("");
    const [dateError, setDateError] = useState("");

    const {
        leads,
        total,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        setQuery,
        setLeads,
        filters,
        setFilters,
    } = useSearchLeads(queryFromUrl);

    const employees = useEmployeesStore((s) => s.employees);
    const currentUser = useAuthStore((state) => state.employee);
    const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);
    const showOwnerFilter = currentUser && ["ADMIN", "SUPER_ADMIN", "LEADMANAGER"].includes(currentUser.role as string);

    const ownerFilterOptions = useMemo(
        () => employees.filter((emp) => OWNER_FILTER_ROLES.includes(emp.role as any)),
        [employees]
    );
    const filteredOwnerOptions = useMemo(() => {
        const q = ownerFilterSearchQuery.trim().toLowerCase();
        if (!q) return ownerFilterOptions;
        return ownerFilterOptions.filter(
            (e) =>
                e.firstName.toLowerCase().includes(q) ||
                e.lastName.toLowerCase().includes(q)
        );
    }, [ownerFilterOptions, ownerFilterSearchQuery]);
    const selectedOwnerLabel = useMemo(() => {
        const id = filters?.leadOwnerId;
        if (!id) return "All";
        const emp = ownerFilterOptions.find((e) => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : "All";
    }, [filters?.leadOwnerId, ownerFilterOptions]);

    const dateFromValue = toLocalDateString(filters?.dateFrom);
    const dateToValue = toLocalDateString(filters?.dateTo);

    const applyFilters = useCallback(
        (next: SearchFilters) => {
            setFilters(next);
            const params = new URLSearchParams(searchParams.toString());
            if (next.status?.length) params.set("status", Array.isArray(next.status) ? next.status.join(",") : next.status);
            else params.delete("status");
            if (next.dateFrom) params.set("dateFrom", next.dateFrom.slice(0, 10));
            else params.delete("dateFrom");
            if (next.dateTo) params.set("dateTo", next.dateTo.slice(0, 10));
            else params.delete("dateTo");
            if (next.leadOwnerId) params.set("leadOwnerId", next.leadOwnerId);
            else params.delete("leadOwnerId");
            router.replace("/search?" + params.toString(), { scroll: false });
        },
        [searchParams, setFilters, router]
    );

    const applyDateRange = useCallback(
        (from: string, to: string) => {
            setDateError("");
            const fromTrim = from.trim();
            const toTrim = to.trim();
            if (fromTrim && toTrim) {
                if (new Date(toTrim) < new Date(fromTrim)) {
                    setDateError("To date must be ≥ From date");
                    return;
                }
            }
            applyFilters({
                ...filters,
                dateFrom: fromTrim ? new Date(fromTrim + "T00:00:00").toISOString() : undefined,
                dateTo: toTrim ? new Date(toTrim + "T23:59:59").toISOString() : undefined,
            });
        },
        [filters, applyFilters]
    );

    // Initial filters from URL (once on mount / when navigating to search with params)
    useEffect(() => {
        const statusRaw = searchParams.get("status");
        let status: LeadStatusType[] | undefined;
        if (statusRaw) {
            const list = statusRaw.split(",").map((x) => x.trim()).filter(Boolean);
            const valid = list.filter((s): s is LeadStatusType => Object.values(LeadStatus).includes(s as LeadStatusType));
            if (valid.length) status = valid;
        }
        const dateFromRaw = searchParams.get("dateFrom");
        const dateToRaw = searchParams.get("dateTo");
        const leadOwnerId = searchParams.get("leadOwnerId") || undefined;
        const dateFrom = dateFromRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateFromRaw) ? new Date(dateFromRaw + "T00:00:00").toISOString() : undefined;
        const dateTo = dateToRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateToRaw) ? new Date(dateToRaw + "T23:59:59").toISOString() : undefined;
        if (status || dateFrom || dateTo || leadOwnerId) {
            setFilters({
                ...(status && { status }),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
                ...(leadOwnerId && { leadOwnerId }),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setQuery(queryFromUrl);
    }, [queryFromUrl]);

    useEffect(() => {
        if (!ownerFilterOpen) return;
        const handle = (e: MouseEvent) => {
            if (ownerFilterRef.current?.contains(e.target as Node)) return;
            setOwnerFilterOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [ownerFilterOpen]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!queryFromUrl) {
            setLeads([])
            return
        }
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );
        const target = observerTarget.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [hasMore, loading, loadingMore, loadMore]);

    if (loading) {
        return <div className={s.LeadsPage}>Loading...</div>;
    }

    return (
        <div className="main__content">
            <div className={s.SearchLeadPage}>


                <h2 className={s.SearchLeadPage__title}>Search results: {queryFromUrl}</h2>

                {queryFromUrl && (
                    <div className={toolbarStyles.LeadsPage__toolbar} ref={ownerFilterRef}>
                        <div className={toolbarStyles.LeadsPage__toolbarRow}>
                            <div className={toolbarStyles.LeadsPage__chips}>
                                <button
                                    type="button"
                                    className={`${toolbarStyles.LeadsPage__chip} ${getSelectedStatuses(filters).length === 0 ? toolbarStyles.LeadsPage__chipActive : ""}`}
                                    onClick={() => applyFilters({ ...filters, status: undefined })}
                                >
                                    All
                                </button>
                                {QUICK_STATUSES.map((st) => {
                                    const ui = LEAD_STATUS_UI[st];
                                    const active = isStatusSelected(filters, st);
                                    return (
                                        <button
                                            key={st}
                                            type="button"
                                            className={`${toolbarStyles.LeadsPage__chip} ${active ? toolbarStyles.LeadsPage__chipActive : ""}`}
                                            style={{
                                                backgroundColor: active ? ui.bg : "var(--lead-chip-bg)",
                                                color: active ? ui.text : "var(--lead-chip-text)",
                                                borderColor: active ? ui.text : "var(--lead-chip-border)",
                                            }}
                                            onClick={() => applyFilters(toggleStatusInFilters(filters, st))}
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
                            {showOwnerFilter && (
                                <div className={toolbarStyles.LeadsPage__ownerWrap}>
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
                                            <svg className={`${selectStyles.Select__chevron} ${ownerFilterOpen ? selectStyles.Select__chevron_open : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>
                                        {ownerFilterOpen && (
                                            <div className={`${selectStyles.Select__dropdown} ${toolbarStyles.LeadsPage__dropdownWithSearch}`}>
                                                <input
                                                    type="text"
                                                    value={ownerFilterSearchQuery}
                                                    onChange={(e) => setOwnerFilterSearchQuery(e.target.value)}
                                                    placeholder="Search owner..."
                                                    className={toolbarStyles.LeadsPage__dropdownSearch}
                                                    aria-label="Search owner"
                                                />
                                                <div className={toolbarStyles.LeadsPage__dropdownList}>
                                                    <button
                                                        type="button"
                                                        className={`${selectStyles.Select__option} ${!filters?.leadOwnerId ? selectStyles.Select__option_selected : ""}`}
                                                        onClick={() => { applyFilters({ ...filters, leadOwnerId: undefined }); setOwnerFilterOpen(false); }}
                                                    >
                                                        All
                                                    </button>
                                                    {filteredOwnerOptions.map((emp) => (
                                                        <button
                                                            key={emp.id}
                                                            type="button"
                                                            className={`${selectStyles.Select__option} ${filters?.leadOwnerId === emp.id ? selectStyles.Select__option_selected : ""}`}
                                                            onClick={() => { applyFilters({ ...filters, leadOwnerId: emp.id }); setOwnerFilterOpen(false); }}
                                                        >
                                                            {emp.firstName} {emp.lastName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {loading && <p>Loading...</p>}

                <div className={s.SearchLeadPage__head}>
                    <h3 className={s.SearchLeadPage__sutitle}>Lead List</h3>
                    {
                        activeLeads.length > 0 && <div className={s.SearchLeadPage__content}>
                            <ButtonComponentDefault
                                onClick={() => setIsStatusModalOpen(true)}

                                type="submit"
                                label={"Update Status"}
                                backgroundColor="#00f5ff"
                                color="#FFFFFF"
                                iconPosition="left"
                            />
                            {isAdmin && <ButtonComponentDefault
                                onClick={() => setIsModalOpen(true)}
                                type="submit"
                                label={"Assign Leads Owner"}
                                backgroundColor="#00f5ff"
                                color="#FFFFFF"
                                iconPosition="left"
                            />}
                        </div>
                    }
                </div>


                <LeadsList setActiveLeads={setActiveLeads} activeLeads={activeLeads} leads={leads} />
                {!loading && leads.length === 0 && (
                    <h2 className={s.SearchLeadPage__404}>Nothing found</h2>
                )}
                <BulkAssignLeadOwnerModel setActiveLeads={setActiveLeads} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} leadIds={activeLeads} />
                <BulkUpdateLeadsStatus setLeads={setLeads} setActiveLeads={setActiveLeads} isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} leadIds={activeLeads} />
                {hasMore && (
                    <div
                        ref={observerTarget}
                        style={{
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "20px 0",
                        }}
                    >
                        {loadingMore && <span>Loading...</span>}
                    </div>
                )}
            </div>
        </div>
    );
}