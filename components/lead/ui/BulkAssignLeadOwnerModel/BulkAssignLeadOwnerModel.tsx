"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import iconClose from "../../assets/close.svg";
import m from "@/components/Modal/Modal.module.scss";
import s from "./BulkAssignLeadOwnerModel.module.scss";
import { useEmployeesStore } from "@/features";
import { useBulkAssignLeadOwner } from "@/features/lead/hooks/useBulkAssignLeadOwner";

interface Props {
  leadIds: string[];
  setActiveLeads: (e: string[]) => void
  isOpen: boolean;
  onClose: () => void;
  /** If set, only these employee IDs are shown (e.g. team members) */
  restrictToEmployeeIds?: string[];
}

export function BulkAssignLeadOwnerModel({
  leadIds,
  isOpen,
  onClose,
  setActiveLeads,
  restrictToEmployeeIds,
}: Props) {
  const { employees } = useEmployeesStore();
  const { assign, loading } = useBulkAssignLeadOwner();

  const allowedRoles = ["AGENT", "TEAMLEADER"];
  const baseEmployees = restrictToEmployeeIds != null && restrictToEmployeeIds.length > 0
    ? employees.filter((emp) => restrictToEmployeeIds.includes(emp.id))
    : employees.filter((emp) => allowedRoles.includes(emp.role));

  const [search, setSearch] = useState("");
  const filteredEmployees = baseEmployees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName} ${emp.middleName ?? ""}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const [selectedOwner, setSelectedOwner] =
    useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedOwner || leadIds.length === 0) return;

    const result = await assign(leadIds, selectedOwner);

    if (result) {
      setActiveLeads([])
      setSelectedOwner(null)
      onClose();
    }
  };

  return (
    <div className={m.Modal} role="dialog" aria-modal="true">
      <div className={m.Modal__backdrop} onClick={onClose} aria-hidden />
      <div className={m.Modal__content} onClick={(e) => e.stopPropagation()}>
        <div className={m.Modal__header}>
          <h3 className={m.Modal__title}>Assign {leadIds.length} lead{leadIds.length !== 1 ? "s" : ""} to owner</h3>
          <button type="button" className={m.Modal__closeBtn} onClick={onClose} aria-label="Close">
            <Image src={iconClose} width={24} height={24} alt="close" />
          </button>
        </div>

        <div className={m.Modal__body}>
          <div className={m.Modal__field}>
            <label htmlFor="assign-owner-search">Search employee</label>
            <input
              id="assign-owner-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <div className={m.Modal__field}>
            <label>Select employee</label>
            <div className={s.LeadUpdateOwner__list}>
            {filteredEmployees.map((emp) => {
              const isActive = selectedOwner === emp.id;

              return (
                <label
                  key={emp.id}
                  className={s.LeadUpdateOwner__label}
                >
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
            onClick={handleSave}
            disabled={!selectedOwner || leadIds.length === 0 || loading}
          >
            {loading ? "Saving..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}