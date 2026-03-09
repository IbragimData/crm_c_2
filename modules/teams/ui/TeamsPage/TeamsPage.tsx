"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { HeaderPage } from "@/components";
import { getTeamsWithDetails } from "@/features/teams/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import type { TeamWithDetailsApi } from "@/config/api-types";
import { TeamFormModal } from "../TeamFormModal/TeamFormModal";
import { TeamItem } from "../TeamItem";
import s from "./TeamsPage.module.scss";
import iconAdd from "../../assets/add.svg";

const CAN_CREATE_TEAM: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

export function TeamsPage() {
  const { employee } = useAuthStore();
  const [teams, setTeams] = useState<TeamWithDetailsApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getTeamsWithDetails();
      setTeams(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canCreate = employee && CAN_CREATE_TEAM.includes(employee.role);

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.page__loading}>Loading…</div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.page__header}>
        <HeaderPage
          title="Teams"
          icon={canCreate ? <Image src={iconAdd} width={14} height={14} alt="" /> : undefined}
          label={canCreate ? "Create team" : undefined}
          backgroundColor="#00f5ff"
          color="#0d0d12"
          iconPosition="left"
          onClick={canCreate ? () => setCreateModalOpen(true) : undefined}
        />
      </div>

      {createModalOpen && (
        <TeamFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={load}
          mode="create"
        />
      )}

      {error && <div className={s.page__error}>{error}</div>}

      {!error && teams.length === 0 && (
        <p className={s.page__empty}>No teams. {canCreate ? "Create the first one." : ""}</p>
      )}

      {!error && teams.length > 0 && (
        <div className={s.Teams__content}>
          {teams.map((team) => (
            <TeamItem key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
