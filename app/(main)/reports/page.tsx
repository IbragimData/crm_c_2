"use client";

import { ReportsPage } from "@/modules/reports";
import s from "./page.module.scss";

export default function ReportsRoute() {
  return (
    <div className={s.reportsPageWrapper}>
      <ReportsPage />
    </div>
  );
}
