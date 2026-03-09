"use client";

import { AttendanceReportPage } from "@/modules/attendance-report";
import s from "./page.module.scss";

export default function AttendanceReportRoute() {
  return (
    <div className={s.wrapper}>
      <AttendanceReportPage />
    </div>
  );
}
