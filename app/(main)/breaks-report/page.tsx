"use client";

import { BreaksReportPage } from "@/modules/breaks-report";
import s from "./page.module.scss";

export default function BreaksReportRoute() {
  return (
    <div className={s.wrapper}>
      <BreaksReportPage />
    </div>
  );
}
