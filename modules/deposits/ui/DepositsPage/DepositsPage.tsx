"use client";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Role } from "@/features/auth/types";
import { DepositsPageAdmin } from "./DepositsPageAdmin";
import { DepositsPageTeamLeader } from "./DepositsPageTeamLeader";
import { DepositsPageAgent } from "./DepositsPageAgent";

export function DepositsPage() {
  const { employee } = useAuthStore();

  if (!employee) return null;

  if (employee.role === Role.ADMIN || employee.role === Role.SUPER_ADMIN) {
    return <DepositsPageAdmin />;
  }
  if (employee.role === Role.TEAMLEADER) {
    return <DepositsPageTeamLeader />;
  }
  if (employee.role === Role.AGENT) {
    return <DepositsPageAgent />;
  }

  return (
    <div style={{ padding: "2rem", color: "var(--color-text-muted)" }}>
      You don't have access to the Deposits section.
    </div>
  );
}
