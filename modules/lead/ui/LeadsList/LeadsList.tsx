"use client";

import { Lead } from "../../../../features/lead/types";
import { LeadItem } from "@/components";
import s from "./LeadsList.module.scss";
import { Dispatch, SetStateAction, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { useEmployeesStore } from "@/features";
import { useLeadListScrollStore, getLeadListScrollStored } from "@/features/lead/store/useLeadListScrollStore";

export interface LeadOwnerOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  leads: Lead[];
  activeLeads: string[];
  setActiveLeads: Dispatch<SetStateAction<string[]>>;
  page?: number;
  total?: number | null;
  pageSize?: number;
  hasMore?: boolean;
  onGoToPage?: (page: number) => void;
  /** When true and ownerOptions/onOwnerChange provided, each row's Lead Owner cell is clickable to assign. */
  canChangeOwner?: boolean;
  ownerOptions?: LeadOwnerOption[];
  onOwnerChange?: (leadId: string, newOwnerId: string) => void | Promise<void>;
  ownerChangeLoading?: boolean;
  /** Key to save/restore scroll (e.g. "leads", "affiliator-123"). Default "leads". */
  listKey?: string;
}

const SCROLL_SAVE_DEBOUNCE_MS = 120;
const DEFAULT_LIST_KEY = "leads";

export function LeadsList({
  leads,
  activeLeads,
  setActiveLeads,
  page = 1,
  total = null,
  pageSize = 20,
  hasMore = false,
  onGoToPage,
  canChangeOwner,
  ownerOptions,
  onOwnerChange,
  ownerChangeLoading,
  listKey = DEFAULT_LIST_KEY,
}: Props) {
  const { employees } = useEmployeesStore();
  const showPagination = onGoToPage != null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setScroll } = useLeadListScrollStore();
  const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBeforeNavigate = useCallback(() => {
    const el = scrollRef.current;
    if (el != null && typeof el.scrollTop === "number") {
      setScroll(listKey, el.scrollTop);
    }
  }, [listKey, setScroll]);

  const applySavedScroll = useCallback(() => {
    const saved = getLeadListScrollStored(listKey);
    if (saved == null || saved <= 0) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = saved;
  }, [listKey]);

  useLayoutEffect(() => {
    applySavedScroll();
    const delays = [50, 120, 300, 550];
    const ids = delays.map((ms) => setTimeout(applySavedScroll, ms));
    return () => ids.forEach(clearTimeout);
  }, [listKey, leads.length, applySavedScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (scrollSaveTimeoutRef.current) clearTimeout(scrollSaveTimeoutRef.current);
      scrollSaveTimeoutRef.current = setTimeout(() => {
        setScroll(listKey, el.scrollTop);
        scrollSaveTimeoutRef.current = null;
      }, SCROLL_SAVE_DEBOUNCE_MS);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (scrollSaveTimeoutRef.current) clearTimeout(scrollSaveTimeoutRef.current);
      setScroll(listKey, el.scrollTop);
    };
  }, [listKey, setScroll]);

  const pageLeadIds = leads.map((l) => l.id);
  const allOnPageSelected =
    pageLeadIds.length > 0 && pageLeadIds.every((id) => activeLeads.includes(id));

  const handleSelectAll = useCallback(() => {
    if (allOnPageSelected) {
      setActiveLeads((prev) => prev.filter((id) => !pageLeadIds.includes(id)));
    } else {
      setActiveLeads((prev) => [...new Set([...prev, ...pageLeadIds])]);
    }
  }, [allOnPageSelected, pageLeadIds, setActiveLeads]);

  const start = leads.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + leads.length;
  const totalLabel =
    total !== null ? total : leads.length >= pageSize ? `${(page - 1) * pageSize + pageSize}+` : end;

  return (
    <div className={s.LeadsList}>
      <div ref={scrollRef} className={s.LeadsList__tableWrap}>
        <table className={s.LeadsList__table}>
          <thead className={s.LeadsList__thead}>
            <tr>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_name}`}>Lead Name</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_phone}`}>Phone</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_email}`}>Email</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_date}`}>Created Date</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_owner}`}>Lead Owner</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_status}`}>Status</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_affiliate}`}>Affiliate</th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_check}`}>
                {leads.length > 0 ? (
                  <button
                    type="button"
                    className={s.LeadsList__selectAllBtn}
                    onClick={handleSelectAll}
                    aria-label={allOnPageSelected ? "Deselect all on page" : "Select all on page"}
                  >
                    {allOnPageSelected ? "Deselect all" : "Select all"}
                  </button>
                ) : null}
              </th>
              <th className={`${s.LeadsList__th} ${s.LeadsList__th_details}`}>Details</th>
            </tr>
          </thead>
          <tbody className={s.LeadsList__tbody}>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} className={s.LeadsList__empty}>
                  No leads match your filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadItem
                  key={lead.id}
                  employees={employees}
                  activeLeads={activeLeads}
                  setActiveLeads={setActiveLeads}
                  lead={lead}
                  canChangeOwner={canChangeOwner}
                  ownerOptions={ownerOptions}
                  onOwnerChange={onOwnerChange}
                  ownerChangeLoading={ownerChangeLoading}
                  onBeforeNavigate={onBeforeNavigate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
      <footer className={s.LeadsList__pagination}>
        <span className={s.LeadsList__paginationTotal}>
          Total leads: {totalLabel}
        </span>
        <div className={s.LeadsList__paginationNav}>
          <span className={s.LeadsList__paginationRange}>
            {leads.length === 0 ? "—" : `${start} – ${end}`}
          </span>
          <div className={s.LeadsList__paginationBtns}>
            <button
              type="button"
              className={s.LeadsList__paginationBtn}
              onClick={() => onGoToPage!(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              type="button"
              className={s.LeadsList__paginationBtn}
              onClick={() => onGoToPage!(page + 1)}
              disabled={!hasMore}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
