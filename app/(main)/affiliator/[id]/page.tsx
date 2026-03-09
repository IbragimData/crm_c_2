"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AffiliatorLeads,
  AffiliatorMainInfo,
  AffiliatorTokens,
  EmployeeDetails,
  TabeListLeadProfile,
} from "@/modules";
import s from "./page.module.scss";
import { useEmployee } from "@/features/employees/hooks/useEmployee";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEffect, useMemo, useState } from "react";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export default function AffiliatorPage() {
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

  // -------- Tabs ----------
  const tabs = useMemo(() => {
    return [
      { id: 1, label: "Main Info" },
      { id: 2, label: "Leads" },
      ...(isAdmin ? [{ id: 3, label: "Safety" }] : []),
    ];
  }, [isAdmin]);

  // -------- Active Tab from URL ----------
  const urlTab = Number(searchParams.get("tab")) || 1;
  const validTab = tabs.some((t) => t.id === urlTab) ? urlTab : 1;

  const [activeTab, setActiveTab] = useState<number>(validTab);

  // Sync on back/forward
  useEffect(() => {
    if (activeTab !== validTab) {
      setActiveTab(validTab);
    }
  }, [validTab]);

  // -------- Tab change ----------
  const handleTabChange = (tab: number) => {
    if (tab === activeTab) return;

    router.replace(`/affiliator/${id}?tab=${tab}`);
  };

  // -------- Guards ----------
  if (!id) return <div className={s.main}><p className={s.main__message}>Employee not found</p></div>;
  if (loading) return <div className={s.main}><p className={s.main__message}>Loading…</p></div>;
  if (!employee) return <div className={s.main}><p className={s.main__message}>Employee not found</p></div>;

  return (
    <div className={s.main}>
      <h1 className={s.main__title}>Affiliator&apos;s Profile</h1>

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
                <AffiliatorMainInfo
                  setEmployee={setEmployee}
                  employee={employee}
                />
              )}

              {activeTab === 2 && (
                <AffiliatorLeads
                  isModalOpen={isModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  activeLeads={activeLeads}
                  setActiveLeads={setActiveLeads}
                  id={id}
                />
              )}

              {activeTab === 3 &&
                (isAdmin ? <AffiliatorTokens employeeId={id} /> : <div>none</div>)}
            </div>
          </TabeListLeadProfile>
        </div>
      </div>
    </div>
  );
}