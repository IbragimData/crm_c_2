"use client";

import { SchedulesPage } from "@/modules/schedule";
import s from "./page.module.scss";

export default function SchedulesRoute() {
  return (
    <div className={s.schedulesPageWrapper}>
      <SchedulesPage />
    </div>
  );
}
