'use client';

import s from "./LeadHistory.module.scss";
import iconCalendar from "../../assets/calendar.svg";
import Image from "next/image";
import { LeadHistoryList } from "../LeadHistoryList";
import { useLeadHistory, LeadHistory as LeadHistoryType } from "@/features";
import { useEffect, useRef } from "react";

interface LeadHistoryProps {
  leadId: string;
}

export function LeadHistory({ leadId }: LeadHistoryProps) {
  const { history, loading, loadMore, hasMore } = useLeadHistory(leadId);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadMore]);

  const groupedHistory = history.reduce<Record<string, LeadHistoryType[]>>(
    (acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(groupedHistory).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className={s.LeadHistory}>
      <div className={s.LeadHistory__scrollWrap}>
        <div className={s.LeadHistory__scroll}>
          <h2 className={s.LeadHistory__title}>History</h2>

          <div className={s.LeadHistory__list}>
            {loading && history.length === 0 ? (
              <p className={s.LeadHistory__loading}>Loading history...</p>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className={s.LeadHistory__day}>
                  <div className={s.LeadHistory__date}>
                    <Image src={iconCalendar} width={18} height={18} alt="" />
                    <span className={s.LeadHistory__dateText}>{date}</span>
                  </div>
                  <LeadHistoryList items={groupedHistory[date]} />
                </div>
              ))
            )}
            <div ref={observerTarget} className={s.LeadHistory__sentinel} />
          </div>
        </div>
      </div>
    </div>
  );
}
