"use client";

import {
  ProjectDetails,
  ProjectEmployees,
  ProjectLeads,
  TabeListLeadProfile,
} from "@/modules";
import s from "./page.module.scss";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;


  // ---------- Tabs ----------
  const tabs = useMemo(
    () => [
      { id: 1, label: "Employees" },
      { id: 2, label: "Leads" },
    ],
    []
  );

  // ---------- Tab из URL ----------
  const urlTab = Number(searchParams.get("tab")) || 1;
  const validTab = tabs.some((t) => t.id === urlTab) ? urlTab : 1;

  const [activeTab, setActiveTab] = useState(validTab);

  useEffect(() => {
    if (activeTab !== validTab) setActiveTab(validTab);
  }, [validTab]);

  const handleTabChange = (tab: number) => {
    if (tab === activeTab) return;
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  // ---------- Guards ----------
  if (!id) return <div>Project not found</div>;
  return (
    <div className={s.main}>
      <h1 className={s.main__title}>Project's Card</h1>

      <div className={s.main__content}>
        <ProjectDetails />

        <div className={s.main__contener}>
          <TabeListLeadProfile
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
          >
            <div className={s.main__page}>
              {activeTab === 1 && <Employees />}
              {activeTab === 2 && <Leads />}
            </div>
          </TabeListLeadProfile>
        </div>
      </div>
    </div>
  );
}

function Employees() {
  return <ProjectEmployees />;
}

function Leads() {
  return <ProjectLeads />;
}