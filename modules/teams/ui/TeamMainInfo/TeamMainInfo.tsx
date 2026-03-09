"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { TeamWithDetailsApi } from "@/config/api-types";
import { updateTeam } from "@/features/teams/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import s from "./TeamMainInfo.module.scss";
import iconPencil from "@/modules/lead/assets/pencil.svg";
import iconClose from "@/components/lead/assets/close.svg";

const CAN_EDIT_TEAM: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
const CAN_DELETE_TEAM: Role[] = [Role.SUPER_ADMIN];

type EditableFieldKey = "name" | "status";

interface TeamMainInfoProps {
  team: TeamWithDetailsApi;
  setTeam: (t: TeamWithDetailsApi) => void;
  leadsCount?: number;
  onDelete?: () => void;
}

export function TeamMainInfo({ team, setTeam, leadsCount, onDelete }: TeamMainInfoProps) {
  const currentUser = useAuthStore((s) => s.employee);
  const canEdit = currentUser && CAN_EDIT_TEAM.includes(currentUser.role);
  const canDelete = currentUser && CAN_DELETE_TEAM.includes(currentUser.role);

  const [formData, setFormData] = useState({ name: team.name, isActive: team.isActive });
  const [editingField, setEditingField] = useState<EditableFieldKey | null>(null);
  const [loading, setLoading] = useState(false);

  const originalData = useMemo(
    () => ({ name: team.name, isActive: team.isActive }),
    [team.id, team.name, team.isActive]
  );

  useEffect(() => {
    setFormData({ name: team.name, isActive: team.isActive });
    setEditingField(null);
  }, [team.id]);

  const createdAt = new Date(team.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const membersCount = team.members?.length ?? 0;
  const leadsCountVal = typeof leadsCount === "number" ? leadsCount : (team.leadAssignments?.length ?? 0);

  const handleChangeName = (value: string) => setFormData((p) => ({ ...p, name: value }));
  const handleChangeStatus = (isActive: boolean) => setFormData((p) => ({ ...p, isActive }));

  const handleStartEdit = (field: EditableFieldKey) => {
    if (!canEdit) return;
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setFormData({ name: originalData.name, isActive: originalData.isActive });
    setEditingField(null);
  };

  const handleSaveField = async () => {
    if (editingField === null) return;
    const name = formData.name.trim();
    if (editingField === "name" && name === originalData.name && formData.isActive === originalData.isActive) {
      setEditingField(null);
      return;
    }
    if (editingField === "status" && formData.isActive === originalData.isActive && formData.name === originalData.name) {
      setEditingField(null);
      return;
    }
    setLoading(true);
    try {
      const updated = await updateTeam(team.id, { name: formData.name.trim(), isActive: formData.isActive });
      setTeam({ ...team, ...updated });
      setEditingField(null);
    } finally {
      setLoading(false);
    }
  };

  const hasChange =
    editingField === "name"
      ? formData.name.trim() !== originalData.name && formData.name.trim().length > 0
      : editingField === "status"
        ? formData.isActive !== originalData.isActive
        : false;

  return (
    <div className={s.TeamMainInfo}>
      <div className={s.TeamMainInfo__content}>
        <h1 className={s.TeamMainInfo__title}>Main info</h1>
        <div className={s.TeamMainInfo__block}>
          <div className={s.TeamMainInfo__column}>
            {/* Name — editable */}
            <div className={s.TeamMainInfo__field}>
              <label className={s.TeamMainInfo__label}>Name</label>
              <div className={s.TeamMainInfo__fieldRow}>
                {editingField === "name" ? (
                  <>
                    <input
                      type="text"
                      className={s.TeamMainInfo__input}
                      value={formData.name}
                      onChange={(e) => handleChangeName(e.target.value)}
                      autoFocus
                    />
                    <div className={s.TeamMainInfo__fieldActions}>
                      <button
                        type="button"
                        className={`${s.TeamMainInfo__iconBtn} ${hasChange ? s.TeamMainInfo__iconBtn_save : ""}`}
                        onClick={handleSaveField}
                        disabled={loading || !hasChange}
                        title="Save"
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button type="button" className={s.TeamMainInfo__iconBtn} onClick={handleCancelEdit} disabled={loading} title="Cancel">
                        <Image src={iconClose} width={16} height={16} alt="Cancel" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={s.TeamMainInfo__value}>{team.name || "—"}</span>
                    {canEdit && (
                      <button type="button" className={s.TeamMainInfo__iconBtn} onClick={() => handleStartEdit("name")} title="Edit">
                        <Image src={iconPencil} width={18} height={18} alt="Edit" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status — editable */}
            <div className={s.TeamMainInfo__field}>
              <label className={s.TeamMainInfo__label}>Status</label>
              <div className={s.TeamMainInfo__fieldRow}>
                {editingField === "status" ? (
                  <>
                    <div className={s.TeamMainInfo__statusGroup}>
                      <button
                        type="button"
                        className={s.TeamMainInfo__statusBtn}
                        data-active={formData.isActive}
                        onClick={() => handleChangeStatus(true)}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        className={s.TeamMainInfo__statusBtn}
                        data-active={!formData.isActive}
                        onClick={() => handleChangeStatus(false)}
                      >
                        Inactive
                      </button>
                    </div>
                    <div className={s.TeamMainInfo__fieldActions}>
                      <button
                        type="button"
                        className={`${s.TeamMainInfo__iconBtn} ${hasChange ? s.TeamMainInfo__iconBtn_save : ""}`}
                        onClick={handleSaveField}
                        disabled={loading || !hasChange}
                        title="Save"
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button type="button" className={s.TeamMainInfo__iconBtn} onClick={handleCancelEdit} disabled={loading} title="Cancel">
                        <Image src={iconClose} width={16} height={16} alt="Cancel" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={s.TeamMainInfo__value}>{team.isActive ? "Active" : "Inactive"}</span>
                    {canEdit && (
                      <button type="button" className={s.TeamMainInfo__iconBtn} onClick={() => handleStartEdit("status")} title="Edit">
                        <Image src={iconPencil} width={18} height={18} alt="Edit" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Created date — read-only */}
            <div className={s.TeamMainInfo__field}>
              <label className={s.TeamMainInfo__label}>Created date</label>
              <div className={s.TeamMainInfo__fieldRow}>
                <span className={s.TeamMainInfo__value}>{createdAt}</span>
              </div>
            </div>
          </div>

          <div className={s.TeamMainInfo__column}>
            <div className={s.TeamMainInfo__field}>
              <label className={s.TeamMainInfo__label}>Members</label>
              <div className={s.TeamMainInfo__fieldRow}>
                <span className={s.TeamMainInfo__value}>{membersCount}</span>
              </div>
            </div>
            <div className={s.TeamMainInfo__field}>
              <label className={s.TeamMainInfo__label}>Leads</label>
              <div className={s.TeamMainInfo__fieldRow}>
                <span className={s.TeamMainInfo__value}>{leadsCountVal}</span>
              </div>
            </div>

            {canDelete && onDelete && (
              <div className={s.TeamMainInfo__deleteWrap}>
                <button type="button" className={s.TeamMainInfo__btnDanger} onClick={onDelete}>
                  Delete team
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
