"use client";

import Image from "next/image";
import {
  LeadDetails,
  LeadHistory,
  LeadMainInfo,
  LeadNoteList,
  LeadCallbacks,
  TabeListLeadProfile,
} from "@/modules";
import s from "./page.module.scss";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLead } from "@/features/lead/hooks";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Lead } from "@/features";
import { useEffect, useMemo, useState } from "react";
import { useLeadsStore, useLeadNavigationStore } from "@/features/lead/store";
import iconReminder from "@/modules/lead/assets/reminder.svg";

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export default function LeadPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { lead: fetchedLead, loading, error: leadError } = useLead(id || "");
  const [lead, setLead] = useState<Lead | null>(null);

  const leads = useLeadsStore((state) => state.leads);
  const { leadIds: navLeadIds } = useLeadNavigationStore();

  const prevNext = useMemo(() => {
    // Prefer navigation context (affiliator / employee list) when current lead is in that list
    const ids = navLeadIds.length > 0 && navLeadIds.includes(id!) ? navLeadIds : leads.map((l) => l.id);
    const idx = ids.indexOf(id!);
    if (idx < 0) return { prevId: null, nextId: null };
    return {
      prevId: idx > 0 ? ids[idx - 1] : null,
      nextId: idx < ids.length - 1 ? ids[idx + 1] : null,
    };
  }, [leads, navLeadIds, id]);

  useEffect(() => {
    if (fetchedLead) setLead(fetchedLead);
  }, [fetchedLead]);

  const currentUser = useAuthStore((state) => state.employee);
  const isAdmin =
    currentUser && ADMIN_ROLES.includes(currentUser.role as any);
  const canSeeHistory =
    currentUser && ["ADMIN", "SUPER_ADMIN"].includes(currentUser.role as string);

  // ---------- Tabs ----------
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 1, label: "Main Info" },
      { id: 3, label: "Notes" },
      {
        id: 4,
        label: "Reminders",
        icon: <Image src={iconReminder} width={18} height={18} alt="" aria-hidden />,
      },
    ];

    if (canSeeHistory) {
      baseTabs.splice(1, 0, { id: 2, label: "History" });
    }

    return baseTabs;
  }, [canSeeHistory]);

  // Tab from URL
  const urlTab = Number(searchParams.get("tab")) || 1;
  const validTab = tabs.some((t) => t.id === urlTab) ? urlTab : 1;

  const [activeTab, setActiveTab] = useState(validTab);

  useEffect(() => {
    if (activeTab !== validTab) {
      setActiveTab(validTab);
    }
  }, [validTab]);

  const handleTabChange = (tab: number) => {
    if (tab === activeTab) return;

    // Only change query, avoid breaking routing
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  // ---------- Guards ----------
  if (!id) return <div>Lead not found</div>;
  if (loading) return <div>Loading...</div>;

  if (leadError === "forbidden") {
    return (
      <div className={s.main}>
        <div className={s.main__forbidden}>
          <p className={s.main__message}>
            You don&apos;t have access to this lead. Only leads in your desk(s) or assigned to you as lead owner are available.
          </p>
          <button
            type="button"
            className={s.main__backBtn}
            onClick={() => router.push("/leads")}
          >
            ← Back to Leads
          </button>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className={s.main}>
      <div className={s.main__header}>
        <h1 className={s.main__title}>Lead&apos;s Profile</h1>
        <div className={s.main__nav}>
          <button
            type="button"
            className={s.main__navBtn}
            disabled={!prevNext.prevId}
            onClick={() => prevNext.prevId && router.push(`/leads/${prevNext.prevId}`)}
          >
            ← Previous
          </button>
          <button
            type="button"
            className={s.main__navBtn}
            disabled={!prevNext.nextId}
            onClick={() => prevNext.nextId && router.push(`/leads/${prevNext.nextId}`)}
          >
            Next →
          </button>
        </div>
      </div>

      <div className={s.main__content}>
        <LeadDetails lead={lead} />

        <div className={s.main__contener}>
          <TabeListLeadProfile
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
          >
            <div className={s.main__page}>
              {activeTab === 1 && (
                <LeadMainInfo setLead={setLead} lead={lead} />
              )}

              {canSeeHistory && activeTab === 2 && <LeadHistory leadId={id} />}

              {activeTab === 3 && <LeadNoteList leadId={id} />}

              {activeTab === 4 && (
                <LeadCallbacks leadId={id} leadOwnerId={lead?.leadOwnerId ?? null} />
              )}
            </div>
          </TabeListLeadProfile>
        </div>
      </div>
    </div>
  );
}

function Notes() {
  return <div>Notes</div>;
}