"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  EmployeeDetails,
  EmployeeLeadsList,
  EmployeeMainInfo,
  EmployeeProjects,
  EmployeeSafety,
  TabeListLeadProfile,
} from "@/modules";
import s from "./page.module.scss";
import { useEmployee } from "@/features/employees/hooks/useEmployee";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEffect, useMemo, useState } from "react";
import { Role } from "@/features/auth/types";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

const ROLES_ADMIN_CAN_CHANGE_PASSWORD = ["AGENT", "TEAMLEADER", "LEADMANAGER"] as const;

export default function EmployeePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { employee, setEmployee, loading } = useEmployee(id || "");

  const [activeLeads, setActiveLeads] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin =
    currentUser && ADMIN_ROLES.includes(currentUser.role as any);

  const canChangePassword = useMemo(() => {
    if (!currentUser || !employee) return false;
    if (currentUser.role === Role.SUPER_ADMIN) return true;
    if (currentUser.role === Role.ADMIN)
      return ROLES_ADMIN_CAN_CHANGE_PASSWORD.includes(employee.role as typeof ROLES_ADMIN_CAN_CHANGE_PASSWORD[number]);
    return false;
  }, [currentUser, employee]);

  /** Role dropdown in Main Info: max ADMIN, min AGENT. SUPER_ADMIN can assign ADMIN; ADMIN cannot. */
  const canChangeRole = useMemo(() => {
    if (!currentUser || !employee) return false;
    if (currentUser.role === Role.SUPER_ADMIN) return true;
    if (currentUser.role === Role.ADMIN) {
      const targetRole = employee.role as string;
      if (targetRole === Role.ADMIN || targetRole === Role.SUPER_ADMIN) return false;
      return true;
    }
    return false;
  }, [currentUser, employee]);

  const allowedRolesForRole = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === Role.SUPER_ADMIN) return [Role.AGENT, Role.TEAMLEADER, Role.LEADMANAGER, Role.ADMIN];
    if (currentUser.role === Role.ADMIN) return [Role.AGENT, Role.TEAMLEADER, Role.LEADMANAGER];
    return [];
  }, [currentUser]);

  // ---------- Tabs ----------
  const tabs = useMemo(() => {
    return [
      { id: 1, label: "Main Info" },
      { id: 3, label: "Leads" },
      ...(isAdmin ? [{ id: 4, label: "Safety" }] : []),
    ];
  }, [isAdmin]);

  // ---------- Tab from URL ----------
  const urlTab = Number(searchParams.get("tab")) || 1;

  const validTab = tabs.some((t) => t.id === urlTab) ? urlTab : 1;

  const [activeTab, setActiveTab] = useState<number>(validTab);

  useEffect(() => {
    if (activeTab !== validTab) {
      setActiveTab(validTab);
    }
  }, [validTab]);

  const handleTabChange = (tab: number) => {
    if (tab === activeTab) return;
    router.replace(`/employees/${id}?tab=${tab}`);
  };

  // ---------- Guards ----------
  if (!id) return <div className={s.main}>Employee not found</div>;
  if (loading) return <div className={s.main}>Loading...</div>;
  if (!employee) return <div className={s.main}>Employee not found</div>;

  return (
    <div className={s.main}>
      <h1 className={s.main__title}>Employee's Profile</h1>

      <div className={s.main__content}>
        <EmployeeDetails employee={employee} />

        <div className={s.main__contener}>
          <TabeListLeadProfile
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
          >
            <div className={s.main__page}>
              {activeTab === 1 && (
                <EmployeeMainInfo
                  setEmployee={setEmployee}
                  employee={employee}
                  canChangeRole={canChangeRole}
                  allowedRolesForRole={allowedRolesForRole}
                />
              )}

              {activeTab === 2 && <EmployeeProjects />}

              {activeTab === 3 && (
                <EmployeeLeadsList
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  activeLeads={activeLeads}
                  setActiveLeads={setActiveLeads}
                  id={id}
                />
              )}

              {activeTab === 4 && isAdmin && (
                <EmployeeSafety
                  employee={employee}
                  setEmployee={setEmployee}
                  canChangePassword={canChangePassword}
                  canDelete={currentUser?.role === Role.SUPER_ADMIN}
                />
              )}
            </div>
          </TabeListLeadProfile>
        </div>
      </div>
    </div>
  );
}
