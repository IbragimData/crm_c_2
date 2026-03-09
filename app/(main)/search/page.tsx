"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import s from "./search.module.scss";
import { useSearchLeads } from "@/features/lead/hooks/useSearchLead";
import { useAuthStore } from "@/features/auth/store/authStore";
import { LeadsList } from "@/modules";
import { BulkAssignLeadOwnerModel, ButtonComponentDefault } from "@/components";
import { BulkUpdateLeadsStatus } from "@/components/lead/ui/BulkUpdateLeadsStatus";
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "TEAMLEADER", "LEADMANAGER"] as const;
export default function Page() {
    const searchParams = useSearchParams();
    const queryFromUrl = (searchParams.get("query") || "").trim();
    const observerTarget = useRef<HTMLDivElement>(null);
    const [activeLeads, setActiveLeads] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const {
        leads,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        setQuery,
        setLeads
    } = useSearchLeads(queryFromUrl);

    // 🔹 если query в URL меняется — обновляем хук
    useEffect(() => {
        setQuery(queryFromUrl);
    }, [queryFromUrl]);

    const currentUser = useAuthStore((state) => state.employee);
    const isAdmin =
        currentUser && ADMIN_ROLES.includes(currentUser.role as any);
    // IntersectionObserver для автоподгрузки
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