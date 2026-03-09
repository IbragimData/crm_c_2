'use client';

import s from "./LeadHistoryList.module.scss";
import { LeadHistory } from "@/features";
import { LeadHistoryRow } from "./LeadHistoryRow";

interface LeadHistoryListProps {
  items: LeadHistory[];
}

export function LeadHistoryList({ items }: LeadHistoryListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={s.LeadHistoryList}>
      {items.map((history) => (
        <LeadHistoryRow key={history.id} history={history} />
      ))}
    </div>
  );
}
