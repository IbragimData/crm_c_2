// features/employees/store/useEmployeesStore.ts

import { create } from "zustand";
import { Employee } from "@/features/auth/types";
import { getEmployees } from "../api/employees";
import { EmployeesFilter } from "../types";

interface EmployeesState {
    employees: Employee[];
    loading: boolean;
    fetchEmployees: (filters?: EmployeesFilter, forceRefresh?: boolean) => Promise<void>;
    updateEmployeeInStore: (employee: Employee) => void;
}

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
    employees: [],
    loading: false,

    fetchEmployees: async (filters, forceRefresh) => {
        if (get().employees.length && !filters && !forceRefresh) return;

        set({ loading: true });

        try {
            const data = await getEmployees(filters);
            set({ employees: data });
        } finally {
            set({ loading: false });
        }
    },

    updateEmployeeInStore: (updatedEmployee) => {
        set((state) => ({
            employees: state.employees.map((emp) =>
                emp.id === updatedEmployee.id ? updatedEmployee : emp
            ),
        }));
    },
}));