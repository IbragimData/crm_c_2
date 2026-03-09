"use client";

import { useEffect, useState } from "react";
import { Employee } from "../../auth/types";
import { getEmployeeById } from "@/features/employees/api/employees";

/**
 * Hook to fetch employee by id.
 * On API error (404 etc.) returns employee: null, loading: false — page can show "Employee not found".
 */
export function useEmployee(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getEmployeeById(id)
      .then((emp) => setEmployee(emp))
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { employee, setEmployee, loading };
}