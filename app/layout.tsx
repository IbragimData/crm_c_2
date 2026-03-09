"use client";

import { ReactNode, useEffect } from "react";
import { useInitAuth } from "@/features/auth/hooks/useInitAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  useInitAuth();

  const isAuthChecked = useAuthStore((s) => s.isAuthChecked);
  const employee = useAuthStore((s) => s.employee);
  const isAuthenticated = !!employee;

  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);
  const employeesLoading = useEmployeesStore((s) => s.loading);

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      fetchEmployees();
    }
  }, [isAuthChecked, isAuthenticated, fetchEmployees]);

  const isAppLoading = !isAuthChecked || employeesLoading;

  return (
    <html lang="en">
      <body>{isAppLoading ? <div>Loading...</div> : children}</body>
    </html>
  );
}