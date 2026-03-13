"use client";

import s from "./LeadMainInfo.module.scss";
import selectStyles from "@/components/Select/Select.module.scss";
import toolbarStyles from "@/modules/lead/ui/LeadsPage/LeadsPage.module.scss";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Lead, LEAD_STATUS_UI, LeadStatus, maskPhone, useEmployeesStore, useUpdateLead, useUpdateLeadStatus } from "@/features";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useC2C } from "@/features/c2c/hooks";
import { getTeamsWithDetails } from "@/features/teams/api/teams.api";
import { LeadUpdateOwner } from "@/components/lead/ui/LeadUpdateOwner";
import Image from "next/image";
import iconPencil from "../../assets/pencil.svg";
import iconClose from "@/components/lead/assets/close.svg";
import iconCall from "@/components/lead/assets/col.svg";
import iconCallYellow from "@/components/lead/assets/col-yellow.svg";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const OWNER_EDIT_ROLES = [
    "LEADMANAGER",
    "ADMIN",
    "SUPER_ADMIN",
    "TEAMLEADER",
] as const;

interface LeadMainInfoProps {
    lead: Lead;
    setLead: (lead: Lead) => void
}

export function LeadMainInfo({ lead, setLead }: LeadMainInfoProps) {
    const [isEditingSeed, setIsEditingSeed] = useState(false);
    const { updateLead, loading: updateLoading } = useUpdateLead()
    const { employees } = useEmployeesStore()
    const currentUser = useAuthStore((state) => state.employee);
    const { call } = useC2C();

    const isAdmin = currentUser && ADMIN_ROLES.includes(currentUser.role as any);

    const handleCallLead = async () => {
        if (!currentUser?.phone || !lead.phone) return;
        try {
            await call(currentUser.phone, lead.phone);
        } catch (err: unknown) {
            console.error("Error calling:", err);
        }
    };

    const handleCallLeadSecondary = async () => {
        if (!currentUser?.phoneSecondary || !lead.phone) return;
        try {
            await call(currentUser.phoneSecondary, lead.phone);
        } catch (err: unknown) {
            console.error("Error calling:", err);
        }
    };

    const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
    const [ownerAllowedEmployeeIds, setOwnerAllowedEmployeeIds] = useState<string[] | null>(null);

    useEffect(() => {
        if (!isOwnerModalOpen || currentUser?.role !== "TEAMLEADER" || !currentUser?.id) return;
        let cancelled = false;
        setOwnerAllowedEmployeeIds(null);
        getTeamsWithDetails()
            .then((teams) => {
                if (cancelled) return;
                const myTeamIds = teams
                    .filter((t) =>
                        t.members?.some(
                            (m) =>
                                m.employeeId === currentUser?.id &&
                                String(m.role).toUpperCase() === "TEAMLEADER"
                        )
                    )
                    .map((t) => t.id);
                const ids = new Set<string>();
                teams
                    .filter((t) => myTeamIds.includes(t.id))
                    .forEach((t) =>
                        t.members?.forEach((m) => ids.add(m.employeeId))
                    );
                setOwnerAllowedEmployeeIds(Array.from(ids));
            })
            .catch(() => setOwnerAllowedEmployeeIds([]));
        return () => {
            cancelled = true;
        };
    }, [isOwnerModalOpen, currentUser?.id, currentUser?.role]);

    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [statusSearchQuery, setStatusSearchQuery] = useState("");
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const statusSearchInputRef = useRef<HTMLInputElement>(null);
    const { updateStatus: updateLeadStatus, loading: statusLoading } = useUpdateLeadStatus();


    const currentOwner = employees.find(
        e => e.id === lead.leadOwnerId
    );

    const currentModified = employees.find(
        e => e.id === lead.modifiedBy
    );

    const canEditOwner =
        currentUser &&
        OWNER_EDIT_ROLES.includes(currentUser.role as any);

    type LeadEditableField = "firstName" | "lastName" | "email" | "phone" | "description" | "connectedTo" | "seedPhrases" | "leadSource";
    const [editingField, setEditingField] = useState<LeadEditableField | null>(null);

    const [formData, setFormData] = useState({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        status: lead.status || LeadStatus.NEW,
        createdBy: lead.createdBy || "",
        modifiedBy: lead.modifiedBy || "",
        connectedTo: lead.connectedTo || "",
        description: lead.description || "",
        seedPhrases: lead.seedPhrases || "",
        leadSource: lead.leadSource || ""
    });
    const originalData = useMemo(() => ({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        status: lead.status || LeadStatus.NEW,
        createdBy: lead.createdBy || "",
        modifiedBy: lead.modifiedBy || "",
        connectedTo: lead.connectedTo || "",
        description: lead.description || "",
        seedPhrases: lead.seedPhrases || "",
        leadSource: lead.leadSource || ""
    }), [lead]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStartEdit = (field: LeadEditableField) => {
        if (field === "seedPhrases" && !isAdmin) setIsEditingSeed(true);
        setEditingField(field);
    };

    const handleCancelEdit = () => {
        if (editingField === null) return;
        setFormData((prev) => ({ ...prev, [editingField]: originalData[editingField] }));
        if (editingField === "seedPhrases" && !isAdmin) setIsEditingSeed(false);
        setEditingField(null);
    };

    const handleSaveField = async () => {
        if (editingField === null) return;
        const value = formData[editingField];
        if (value === originalData[editingField]) {
            setEditingField(null);
            return;
        }
        const payload = { [editingField]: value };
        const updated = await updateLead(lead.id, payload);
        if (updated) {
            setLead({ ...lead, ...updated });
            if (editingField === "seedPhrases" && !isAdmin) {
                setFormData((prev) => ({ ...prev, seedPhrases: "" }));
                setIsEditingSeed(false);
            }
            setEditingField(null);
        }
    };

    const renderField = (key: LeadEditableField, label: string, isTextarea = false) => {
        const isEditing = editingField === key;
        const hasChange = formData[key] !== originalData[key];
        let displayValue: string = formData[key] || "";
        if (key === "phone" && !isAdmin) displayValue = maskPhone(formData.phone);
        if (key === "seedPhrases" && !isAdmin && !isEditingSeed) displayValue = "";
        if (!displayValue) displayValue = "—";
        const canEdit = key !== "phone" || isAdmin;
        return (
            <div key={key} className={s.LeadMainInfo__field}>
                <label className={s.LeadMainInfo__label}>{label}</label>
                <div className={s.LeadMainInfo__fieldRow}>
                    {isEditing ? (
                        <>
                            {isTextarea ? (
                                <textarea
                                    className={s.LeadMainInfo__textarea}
                                    value={formData[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <input
                                    type="text"
                                    className={s.LeadMainInfo__input}
                                    value={formData[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    autoFocus
                                />
                            )}
                            <div className={s.LeadMainInfo__fieldActions}>
                                <button
                                    type="button"
                                    className={`${s.LeadMainInfo__iconBtn} ${hasChange ? s.LeadMainInfo__iconBtn_save : ""}`}
                                    onClick={handleSaveField}
                                    disabled={updateLoading || !hasChange}
                                    title="Save"
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                                <button type="button" className={s.LeadMainInfo__iconBtn} onClick={handleCancelEdit} disabled={updateLoading} title="Cancel">
                                    <Image src={iconClose} width={16} height={16} alt="Cancel" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {key === "phone" && lead.phone ? (
                                <div className={s.LeadMainInfo__phoneWrap}>
                                    <span className={s.LeadMainInfo__value}>{displayValue}</span>
                                    {currentUser?.phone && (
                                        <button
                                            type="button"
                                            className={s.LeadMainInfo__phoneCallBtn}
                                            onClick={handleCallLead}
                                            aria-label="Call lead"
                                            title="Verify / Call"
                                        >
                                            <Image src={iconCall} width={15} height={15} alt="" />
                                        </button>
                                    )}
                                    {currentUser?.phoneSecondary && (
                                        <button
                                            type="button"
                                            className={`${s.LeadMainInfo__phoneCallBtn} ${s.LeadMainInfo__phoneCallBtn_secondary}`}
                                            onClick={handleCallLeadSecondary}
                                            disabled={!lead.phone}
                                            aria-label="Call lead (second number)"
                                            title="Call using second number"
                                        >
                                            <Image src={iconCallYellow} width={15} height={15} alt="" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span className={s.LeadMainInfo__value}>{displayValue}</span>
                            )}
                            {canEdit && (
                                <button type="button" className={s.LeadMainInfo__iconBtn} onClick={() => handleStartEdit(key)} title="Edit">
                                    <Image src={iconPencil} width={18} height={18} alt="Edit" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Modal state

    // Close status dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };
        if (isStatusDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isStatusDropdownOpen]);

    const filteredStatuses = useMemo(() => {
        const q = statusSearchQuery.trim().toLowerCase();
        const all = Object.values(LeadStatus);
        if (!q) return all;
        return all.filter((st) => LEAD_STATUS_UI[st].label.toLowerCase().includes(q));
    }, [statusSearchQuery]);

    useEffect(() => {
        if (isStatusDropdownOpen) {
            setStatusSearchQuery("");
            setTimeout(() => statusSearchInputRef.current?.focus(), 0);
        }
    }, [isStatusDropdownOpen]);

    const handleStatusSelect = useCallback(
        async (st: LeadStatus) => {
            const updated = await updateLeadStatus(lead.id, st);
            if (updated) {
                setFormData((prev) => ({ ...prev, status: st }));
                setLead(updated);
                setIsStatusDropdownOpen(false);
            }
        },
        [lead.id, updateLeadStatus, setLead]
    );

    const statusGlowRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    useEffect(() => {
        if (!isAdmin) {
            setFormData(prev => ({ ...prev, seedPhrases: "" }));
            setIsEditingSeed(false);
        }
    }, [isAdmin]);
    return (
        <div className={s.LeadMainInfo}>
            <div className={s.LeadMainInfo__scrollWrap}>
                <div className={s.LeadMainInfo__scroll}>
                <div className={s.LeadMainInfo__content}>
                    <h1 className={s.LeadMainInfo__title}>Main info</h1>
                    <div className={s.LeadMainInfo__block}>
                    <div className={s.LeadMainInfo__column}>
                        {renderField("firstName", "First Name")}
                        {renderField("lastName", "Last Name")}
                        <div className={s.LeadMainInfo__box} ref={statusDropdownRef}>
                            <label className={s.LeadMainInfo__label}>Status</label>
                            <div className={s.LeadMainInfo__statusWrap}>
                                <button
                                    type="button"
                                    className={`${s.LeadMainInfo__status} ${isStatusDropdownOpen ? s.LeadMainInfo__status_open : ""}`}
                                    style={{
                                        backgroundColor: LEAD_STATUS_UI[formData.status].bg,
                                        color: LEAD_STATUS_UI[formData.status].text,
                                        ['--status-glow' as string]: statusGlowRgba(LEAD_STATUS_UI[formData.status].bg, 0.4),
                                    }}
                                    onClick={() => setIsStatusDropdownOpen((v) => !v)}
                                    disabled={statusLoading}
                                >
                                    <span>{LEAD_STATUS_UI[formData.status].label}</span>
                                    <svg
                                        className={`${selectStyles.Select__chevron} ${isStatusDropdownOpen ? selectStyles.Select__chevron_open : ""}`}
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
                                {isStatusDropdownOpen && (
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
                                                            className={`${selectStyles.Select__option} ${s.LeadMainInfo__statusOption}`}
                                                            disabled={statusLoading}
                                                            onClick={() => handleStatusSelect(st)}
                                                        >
                                                            <span
                                                                className={s.LeadMainInfo__statusChip}
                                                                style={{
                                                                    backgroundColor: ui.bg,
                                                                    color: ui.text,
                                                                    ['--chip-glow' as string]: statusGlowRgba(ui.bg, 0.5),
                                                                }}
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
                        </div>
                        {renderField("seedPhrases", "Seed Phrases", true)}
                    </div>
                    <div className={s.LeadMainInfo__column}>
                        {renderField("email", "Email")}
                        {renderField("phone", "Phone")}
                        <div className={s.LeadMainInfo__contener}>
                            <h3>Lead Owner</h3>
                            <div
                                style={{
                                    cursor: canEditOwner ? "pointer" : "default"
                                }}
                                onClick={() => {
                                    if (canEditOwner) {
                                        setIsOwnerModalOpen(true);
                                    }
                                }}
                            >
                                {currentOwner ? `${currentOwner?.firstName} ${currentOwner?.lastName}` : "Not assigned"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={s.LeadMainInfo__block}>
                {renderField("description", "Description", true)}
            </div>

            <div className={s.LeadMainInfo__content}>
                <h1 className={s.LeadMainInfo__title}>Management</h1>
                <div className={s.LeadMainInfo__block}>
                    
                    <div className={s.LeadMainInfo__column}>
                        {renderField("connectedTo", "Connected To")}
                        {renderField("leadSource", "Lead Source")}
                    </div>

                    <div className={s.LeadMainInfo__column}>
                        <div className={s.LeadMainInfo__contener}>
                            <h3>Modified By</h3>
                            <div>
                                {currentModified ? `${currentModified?.firstName} ${currentModified?.lastName}` : "Not assigned"}
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            </div>
            </div>

            <LeadUpdateOwner
                setLead={setLead}
                leadId={lead.id}
                currentOwnerId={lead.leadOwnerId}
                isOpen={isOwnerModalOpen}
                onClose={() => setIsOwnerModalOpen(false)}
                restrictToEmployeeIds={
                    currentUser?.role === "TEAMLEADER"
                        ? ownerAllowedEmployeeIds ?? undefined
                        : undefined
                }
            />
        </div>
    );
}