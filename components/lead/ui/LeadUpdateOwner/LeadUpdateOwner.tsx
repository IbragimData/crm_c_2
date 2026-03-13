"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Lead, useEmployeesStore } from "@/features";
import { useUpdateLeadOwner } from "@/features/lead/hooks/useUpdateLeadOwner";

import m from "@/components/Modal/Modal.module.scss";
import s from "./LeadUpdateOwner.module.scss";
import iconClose from "../../assets/close.svg";

interface Props {
  leadId: string;
  currentOwnerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  setLead: (lead: Lead) => void;
  /** When set (e.g. for team leader), only these employee IDs are shown in the list */
  restrictToEmployeeIds?: string[] | null;
}

export function LeadUpdateOwner({
  leadId,
  currentOwnerId,
  isOpen,
  onClose,
  setLead,
  restrictToEmployeeIds,
}: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const { employees } = useEmployeesStore();
  const { updateOwner, loading: updating } = useUpdateLeadOwner();

  const allowedRoles = ["AGENT", "TEAMLEADER"];
  const baseEmployees =
    restrictToEmployeeIds != null && restrictToEmployeeIds.length > 0
      ? employees.filter((emp) => restrictToEmployeeIds.includes(emp.id))
      : employees.filter((emp) => allowedRoles.includes(emp.role));

  const [search, setSearch] = useState("");

  const filteredEmployees = baseEmployees.filter((emp) => {
    const fullName =
      `${emp.firstName} ${emp.lastName} ${emp.middleName ?? ""}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
    );
  });


  const [selectedOwner, setSelectedOwner] = useState<string | null>(
    currentOwnerId || null
  );

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedOwner) return;
    const updated = await updateOwner(leadId, selectedOwner);
    if (updated) {
      setLead(updated);
      onClose();
    }
  };

  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>Change Lead Owner</h3>
          <button
            type="button"
            className={m.Modal__closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Image src={iconClose} width={24} height={24} alt="" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <div className={m.Modal__field}>
            <label htmlFor="lead-owner-search">Search employee</label>
            <input
              id="lead-owner-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <div className={m.Modal__field}>
            <label>Select new owner</label>
            <div className={s.LeadUpdateOwner__list}>
              {filteredEmployees.length === 0 ? (
                <div className={s.LeadUpdateOwner__empty}>
                  {search.trim() ? "No matching employees" : "No employees"}
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isActive = selectedOwner === emp.id;
                  return (
                    <label key={emp.id} className={s.LeadUpdateOwner__label}>
                      <input
                        type="radio"
                        name="owner"
                        checked={isActive}
                        onChange={() => setSelectedOwner(emp.id)}
                      />
                      <div
                        className={`${s.LeadUpdateOwner__item}${isActive ? ` ${s.LeadUpdateOwner__item_active}` : ""}`}
                      >
                        <div className={s.LeadUpdateOwner__image}>
                          {emp.firstName?.charAt(0)}
                        </div>
                        <div className={s.LeadUpdateOwner__info}>
                          <span className={s.LeadUpdateOwner__name}>
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className={s.LeadUpdateOwner__email}>
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
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
            onClick={handleSave}
            disabled={!selectedOwner || updating}
          >
            {updating ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}