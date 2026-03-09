"use client";

import { Lead } from "../../../../features/lead/types";
import { LeadItem } from "@/components";
import s from "./LeadsList.module.scss";
import { Dispatch, SetStateAction, useCallback } from "react";
import { useEmployeesStore } from "@/features";

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
}

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
}: Props) {
  const { employees } = useEmployeesStore();
  const showPagination = onGoToPage != null;

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
      <div className={s.LeadsList__tableWrap}>
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
