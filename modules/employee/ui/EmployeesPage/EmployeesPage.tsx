"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HeaderPage } from "@/components";
import Image from "next/image";
import iconAdd from "../../assets/add.svg";
import s from "./EmployeesPage.module.scss";
import { EmployeesList } from "../EmployeesList";
import { roleLabels, useEmployeesStore } from "@/features";

export function EmployeesPage() {
  const router = useRouter();
  const { employees, loading } = useEmployeesStore();

  // 🔹 Группировка сотрудников по ролям
  const groupedByRole = useMemo(() => {
    return Object.entries(
      employees.reduce<Record<string, typeof employees>>((acc, emp) => {
        if (!acc[emp.role]) acc[emp.role] = [];
        acc[emp.role].push(emp);
        return acc;
      }, {})
    );
  }, [employees]);

  // 🔹 Нужный порядок ролей
  const roleOrder = ["ADMIN", "LEADMANAGER", "TEAMLEADER", "AGENT"];

  const sortedEmployees = useMemo(() => {
    return groupedByRole
      .filter(([role]) => roleOrder.includes(role))
      .sort(
        ([roleA], [roleB]) => roleOrder.indexOf(roleA) - roleOrder.indexOf(roleB)
      );
  }, [groupedByRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={s.EmployeesPage}>
      <HeaderPage
        title="Employees"
        icon={<Image src={iconAdd} width={14} height={14} alt="add" />}
        label="Create New Employees"
        backgroundColor="#00f5ff"
        color="#0d0d12"
        iconPosition="left"
        onClick={() => router.push("/employees/create")}
      />

      {sortedEmployees.map(([role, employees]) => (
        <div key={role}>
          <div className={s.EmployeesPage__block}>
            <span>{roleLabels[role]}s</span>
          </div>
          <EmployeesList employees={employees} />
        </div>
      ))}
    </div>
  );
}