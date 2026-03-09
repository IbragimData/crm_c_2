"use client";

import { AffiliatorItem, HeaderPage } from "@/components";
import s from "./AffiliatorPage.module.scss";
import iconAdd from "../../assets/add.svg";
import Image from "next/image";
import { useEmployeesStore } from "@/features";
import { Role } from "@/features/auth/types";

export function AffiliatorPage() {
  const { employees, loading } = useEmployeesStore();

  // 🔹 Фильтруем только афилиаторов
  const affiliators = employees.filter(emp => emp.role === Role.AFFILIATOR);

  return (
    <div className={s.Affiliator}>
      <HeaderPage
        title="Affiliators"
        icon={<Image src={iconAdd} width={14} height={14} alt="add" />}
        label="Create new Affiliator"
        backgroundColor="#00f5ff"
        color="#0d0d12"
        iconPosition="left"
      />

      <div className={s.Affiliator__content}>
        {loading && <p>Loading...</p>}

        {!loading &&
          affiliators.map(emp => (
            <AffiliatorItem key={emp.id} employee={emp} />
          ))}
      </div>
    </div>
  );
}