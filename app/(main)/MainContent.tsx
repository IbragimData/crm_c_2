"use client";

import { useEffect } from "react";
import { Header } from "@/widgets/header/ui/Header/Header";
import { useBreaksStore } from "@/features/breaks/store/useBreaksStore";
import { useAttendanceStore } from "@/features/attendance/store/useAttendanceStore";
import { BreakOverlay } from "@/features/breaks/ui";
import { AttendanceOverlay } from "@/features/attendance/ui";

const SIDEBAR_OFFSET = 240;

export function MainContent({ children }: { children: React.ReactNode }) {
  const marginLeft = SIDEBAR_OFFSET;
  const hydrateBreaks = useBreaksStore((s) => s.hydrate);
  const hydrateAttendance = useAttendanceStore((s) => s.hydrate);

  useEffect(() => {
    hydrateBreaks();
    hydrateAttendance();
  }, [hydrateBreaks, hydrateAttendance]);

  return (
    <div
      className="main__wrapper"
      style={{
        marginLeft,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Header />
      {children}
      <BreakOverlay />
      <AttendanceOverlay />
    </div>
  );
}
