"use client";

import { DepositsPage } from "@/modules/deposits";
import s from "./page.module.scss";

export default function DepositsRoutePage() {
  return (
    <div className={s.main}>
      <DepositsPage />
    </div>
  );
}
