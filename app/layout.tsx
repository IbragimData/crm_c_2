"use client";

import { ReactNode, useEffect } from "react";
import { useInitAuth } from "@/features/auth/hooks/useInitAuth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEmployeesStore } from "@/features/employees/store/useEmployeesStore";
import { CallbackDueToast } from "@/features/schedule/ui/CallbackDueToast";
import { CallbackPollingTrigger } from "@/features/schedule/store/CallbackPollingTrigger";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  useInitAuth();

  const isAuthChecked = useAuthStore((s) => s.isAuthChecked);
  const employee = useAuthStore((s) => s.employee);
  const isAuthenticated = !!employee;

  const fetchEmployees = useEmployeesStore((s) => s.fetchEmployees);

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      fetchEmployees();
    }
  }, [isAuthChecked, isAuthenticated, fetchEmployees]);

  const isAppLoading = !isAuthChecked;

  return (
    <html lang="en">
      <body>
        {isAppLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            {children}
            {isAuthenticated && (
              <>
                <CallbackPollingTrigger key="callback-polling" />
                <CallbackDueToast key="callback-due-toast" />
              </>
            )}
          </>
        )}
      </body>
    </html>
  );
}