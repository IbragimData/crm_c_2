"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import iconClose from "../../assets/close.svg";
import m from "@/components/Modal/Modal.module.scss";
import s from "./BulkDistributeLeadsModal.module.scss";
import { useEmployeesStore } from "@/features";
import { useBulkAssignLeadOwnerRandom } from "@/features/lead/hooks/useBulkAssignLeadOwnerRandom";

interface Props {
  leadIds: string[];
  setActiveLeads: (e: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  /** If set, only these employee IDs are shown (e.g. team members) */
  restrictToEmployeeIds?: string[];
  /** Called after successful distribution (e.g. to refresh list) */
  onSuccess?: () => void;
}

const ALLOWED_OWNER_ROLES = ["AGENT", "TEAMLEADER"];

export function BulkDistributeLeadsModal({
  leadIds,
  isOpen,
  onClose,
  setActiveLeads,
  restrictToEmployeeIds,
  onSuccess,
}: Props) {
  const { employees } = useEmployeesStore();
  const { distribute, loading } = useBulkAssignLeadOwnerRandom();

  const baseEmployees =
    restrictToEmployeeIds != null && restrictToEmployeeIds.length > 0
      ? employees.filter((emp) => restrictToEmployeeIds.includes(emp.id))
      : employees.filter((emp) => ALLOWED_OWNER_ROLES.includes(emp.role));

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredEmployees = baseEmployees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName} ${emp.middleName ?? ""}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedIds(new Set());
      setSearch("");
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const toggleOwner = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDistribute = async () => {
    const ownerIds = Array.from(selectedIds);
    if (ownerIds.length === 0 || leadIds.length === 0) return;

    const result = await distribute(leadIds, ownerIds);

    if (result) {
      setActiveLeads([]);
      setSelectedIds(new Set());
      onSuccess?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>
            Distribute {leadIds.length} lead{leadIds.length !== 1 ? "s" : ""} among owners
          </h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="close" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <p className={s.BulkDistributeLeadsModal__hint}>
            Select one or more owners. Leads will be shuffled and split evenly (e.g. 8 leads, 4 owners → 2 each).
          </p>
          <div className={m.Modal__field}>
            <label htmlFor="distribute-owner-search">Search employee</label>
            <input
              id="distribute-owner-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <div className={m.Modal__field}>
            <label>Select owners (multiple)</label>
            <div className={s.BulkDistributeLeadsModal__list}>
              {filteredEmployees.map((emp) => {
                const isChecked = selectedIds.has(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={s.BulkDistributeLeadsModal__label}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOwner(emp.id)}
                    />
                    <div
                      className={
                        isChecked
                          ? s.BulkDistributeLeadsModal__item_active
                          : s.BulkDistributeLeadsModal__item
                      }
                    >
                      <div className={s.BulkDistributeLeadsModal__image}>
                        {emp.firstName?.charAt(0)}
                      </div>
                      <div>
                        <h3>
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p>{emp.email}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className={m.Modal__actions}>
          <button type="button" className={m.Modal__cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={m.Modal__submit}
            onClick={handleDistribute}
            disabled={selectedIds.size === 0 || leadIds.length === 0 || loading}
          >
            {loading ? "Distributing…" : "Distribute"}
          </button>
        </div>
      </div>
    </div>
  );
}
