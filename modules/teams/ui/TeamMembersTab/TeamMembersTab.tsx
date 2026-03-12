"use client";

import { useState } from "react";
import Link from "next/link";
import type { TeamMemberApi } from "@/config/api-types";
import { deleteTeamMember } from "@/features/teams/api";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { AddTeamMemberModal } from "../AddTeamMemberModal/AddTeamMemberModal";
import s from "./TeamMembersTab.module.scss";

const ROLE_LABELS: Record<string, string> = {
  TEAMLEADER: "Team Lead",
  AGENT: "Agent",
  LEADMANAGER: "Lead Manager",
  ADMIN: "Admin",
};

interface TeamMembersTabProps {
  teamId: string;
  members: TeamMemberApi[];
  onRefresh: () => void;
  canManage: boolean;
}

export function TeamMembersTab({ teamId, members, onRefresh, canManage }: TeamMembersTabProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const employees = useEmployeesStore((state) => state.employees);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove member from desk?")) return;
    setDeletingId(id);
    try {
      await deleteTeamMember(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : employeeId.slice(0, 8);
  };

  return (
    <div className={s.TeamMembersTab}>
      <div className={s.TeamMembersTab__head}>
        <h1 className={s.TeamMembersTab__title}>Members ({members.length})</h1>
        {canManage && (
          <button type="button" className={s.TeamMembersTab__addBtn} onClick={() => setAddModalOpen(true)}>
            Add member
          </button>
        )}
      </div>
      {addModalOpen && (
        <AddTeamMemberModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false);
            onRefresh();
          }}
          teamId={teamId}
          excludeEmployeeIds={members.map((m) => m.employeeId)}
        />
      )}
      <div className={s.TeamMembersTab__tableWrap}>
        {members.length === 0 ? (
          <table className={s.TeamMembersTab__table}>
            <thead className={s.TeamMembersTab__thead}>
              <tr>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_name}`}>Employee</th>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_role}`}>Role</th>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_date}`}>Added date</th>
                {canManage && <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_actions}`} />}
              </tr>
            </thead>
            <tbody className={s.TeamMembersTab__tbody}>
              <tr>
                <td colSpan={canManage ? 4 : 3} className={s.TeamMembersTab__empty}>
                  No members
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className={s.TeamMembersTab__table}>
            <thead className={s.TeamMembersTab__thead}>
              <tr>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_name}`}>Employee</th>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_role}`}>Role</th>
                <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_date}`}>Added date</th>
                {canManage && <th className={`${s.TeamMembersTab__th} ${s.TeamMembersTab__th_actions}`} />}
              </tr>
            </thead>
            <tbody className={s.TeamMembersTab__tbody}>
              {members.map((m) => (
                <tr key={m.id} className={s.TeamMembersTab__row}>
                  <td className={s.TeamMembersTab__cell}>
                    <Link href={`/employees/${m.employeeId}`} className={s.TeamMembersTab__cellLink}>
                      {getEmployeeName(m.employeeId)}
                    </Link>
                  </td>
                  <td className={s.TeamMembersTab__cell}>{ROLE_LABELS[m.role] ?? m.role}</td>
                  <td className={s.TeamMembersTab__cell}>
                    {new Date(m.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </td>
                  {canManage && (
                    <td className={`${s.TeamMembersTab__cell} ${s.TeamMembersTab__cell_actions}`}>
                      <button
                        type="button"
                        className={s.TeamMembersTab__delBtn}
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                      >
                        {deletingId === m.id ? "…" : "Remove"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
