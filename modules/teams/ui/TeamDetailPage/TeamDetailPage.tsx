"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getTeams,
  getTeamMembers,
  getLeadAssignmentsByTeam,
} from "@/features/teams/api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import type { TeamWithDetailsApi } from "@/config/api-types";
import { TabeListLeadProfile } from "@/modules";
import { TeamDetails } from "../TeamDetails/TeamDetails";
import { DeleteTeamConfirmModal } from "../DeleteTeamConfirmModal/DeleteTeamConfirmModal";
import { TeamMainInfo } from "../TeamMainInfo/TeamMainInfo";
import { TeamMembersTab } from "../TeamMembersTab/TeamMembersTab";
import { TeamLeadsTab } from "../TeamLeadsTab/TeamLeadsTab";
import pageStyles from "@/app/(main)/teams/[id]/page.module.scss";

const CAN_MANAGE_MEMBERS: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

export function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { employee } = useAuthStore();
  const teamId = typeof params.id === "string" ? params.id : "";
  const [team, setTeam] = useState<TeamWithDetailsApi | null>(null);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeLeads, setActiveLeads] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setError(null);
    setLoading(true);
    try {
      const [teamsRes, membersRes, assignmentsRes] = await Promise.all([
        getTeams(),
        getTeamMembers(teamId),
        getLeadAssignmentsByTeam(teamId, { skip: 0, take: 30 }),
      ]);
      const baseTeam = teamsRes.find((t) => t.id === teamId) ?? null;
      if (!baseTeam) {
        setTeam(null);
        return;
      }
      setLeadsTotal(assignmentsRes.total);
      const teamWithDetails: TeamWithDetailsApi = {
        ...baseTeam,
        members: membersRes.items ?? [],
        leadAssignments: assignmentsRes.items ?? [],
      };
      setTeam(teamWithDetails);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManageMembers = employee && CAN_MANAGE_MEMBERS.includes(employee.role);

  const tabs = useMemo(
    () => [
      { id: 1, label: "Main" },
      { id: 2, label: "Members" },
      { id: 3, label: "Leads" },
    ],
    []
  );

  const urlTab = Number(searchParams.get("tab")) || 1;
  const validTab = tabs.some((t) => t.id === urlTab) ? urlTab : 1;
  const [activeTab, setActiveTab] = useState(validTab);

  useEffect(() => {
    if (activeTab !== validTab) setActiveTab(validTab);
  }, [validTab]);

  const handleTabChange = (tab: number) => {
    if (tab === activeTab) return;
    router.replace(`/teams/${teamId}?tab=${tab}`);
  };

  const handleDeleteSuccess = useCallback(() => {
    router.replace("/teams");
  }, [router]);

  if (loading) {
    return (
      <div className={pageStyles.main}>
        <div className={pageStyles.page__loading}>Loading…</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className={pageStyles.main}>
        <div className={pageStyles.page__error}>{error || "Team not found"}</div>
        <Link href="/teams" className={pageStyles.page__back}>
          ← Back to teams
        </Link>
      </div>
    );
  }

  const members = team.members ?? [];

  return (
    <div className={pageStyles.main}>
      <h1 className={pageStyles.main__title}>Team Profile</h1>

      <div className={pageStyles.main__content}>
        <TeamDetails
          team={team}
          leadsCount={leadsTotal}
        />

        <div className={pageStyles.main__contener}>
          <TabeListLeadProfile tabs={tabs} activeTab={activeTab} onChange={handleTabChange}>
            <div className={pageStyles.main__page}>
              {activeTab === 1 && (
                <TeamMainInfo
                  team={team}
                  setTeam={setTeam}
                  leadsCount={leadsTotal}
                  onDelete={() => setDeleteModalOpen(true)}
                />
              )}
              {activeTab === 2 && (
                <TeamMembersTab
                  teamId={team.id}
                  members={members}
                  onRefresh={load}
                  canManage={!!canManageMembers}
                />
              )}
              {activeTab === 3 && (
                <TeamLeadsTab
                  teamId={team.id}
                  members={members}
                  expectedLeadsTotal={leadsTotal}
                  activeLeads={activeLeads}
                  setActiveLeads={setActiveLeads}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                />
              )}
            </div>
          </TabeListLeadProfile>
        </div>
      </div>

      {deleteModalOpen && (
        <DeleteTeamConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
          teamId={team.id}
          teamName={team.name}
        />
      )}
    </div>
  );
}
