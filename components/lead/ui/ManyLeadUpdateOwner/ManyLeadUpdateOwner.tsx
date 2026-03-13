"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ButtonComponentDefault, ButtonComponentMain } from "@/components/ButtonComponents";
import { Lead, useEmployeesStore } from "@/features";
import { useUpdateLeadOwner } from "@/features/lead/hooks/useUpdateLeadOwner";

import s from "./ManyLeadUpdateOwner.module.scss";
import iconClose from "../../assets/close.svg";

interface Props {
  leadId: string;
  currentOwnerId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  setLead: (lead: Lead) => void
}

export function ManyLeadUpdateOwner({
  leadId,
  currentOwnerId,
  isOpen,
  onClose,
  setLead

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

  const { employees, loading } = useEmployeesStore();
  const { updateOwner, loading: updating } = useUpdateLeadOwner();

  const allowedRoles = ["AGENT", "TEAMLEADER"];

  const filteredEmployees = employees.filter(emp =>
    allowedRoles.includes(emp.role)
  );

  const [selectedOwner, setSelectedOwner] = useState<string | null>(
    currentOwnerId || null
  );

  console.log(employees)
  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedOwner) return;

    const updated = await updateOwner(leadId, selectedOwner);

    if (updated) {
      setLead(updated)
      onClose();

    }
  };

  return (
    <div className={s.LeadUpdateOwner}>
      <div className={s.LeadUpdateOwner__content}>
        <div className={s.LeadUpdateOwner__header}>
          <h3>Update Lead Owner</h3>
          <ButtonComponentMain
            icon={<Image src={iconClose} width={24} height={24} alt="close" />}
            onClick={onClose}
          />
        </div>

        <h3>Employees</h3>

        <div className={s.LeadUpdateOwner__list}>
          {filteredEmployees.map((emp) => {
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

        <div className={s.LeadUpdateOwner__buttons}>
          <button
            className={s.LeadUpdateOwner__button}
            onClick={onClose}
          >
            Cancel
          </button>

          <ButtonComponentDefault
            label={updating ? "Saving..." : "Save Owner"}
            color="#ffffff"
            backgroundColor="#3f8cff"
            onClick={handleSave}
          />
        </div>
      </div>
    </div>
  );
}