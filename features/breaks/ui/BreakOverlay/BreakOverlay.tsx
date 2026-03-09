"use client";

import { useEffect, useState } from "react";
import { useBreaksStore } from "../../store/useBreaksStore";
import { BREAK_TYPE_LABELS } from "../../types";
import s from "./BreakOverlay.module.scss";

export function BreakOverlay() {
  const currentBreak = useBreaksStore((s) => s.currentBreak);
  const endBreak = useBreaksStore((s) => s.endBreak);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!currentBreak) return;
    const start = new Date(currentBreak.startedAt).getTime();
    const update = () => {
      setElapsedMinutes(Math.floor((Date.now() - start) / 60000));
    };
    update();
    const interval = setInterval(update, 1000); // every second for accurate minute display
    return () => clearInterval(interval);
  }, [currentBreak]);

  if (!currentBreak) return null;

  const handleComeBack = async () => {
    try {
      await endBreak();
    } catch {
      // Error shown in header
    }
  };

  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const timeStr = `${hours}H ${mins}M`;

  return (
    <div className={s.breakOverlay} role="dialog" aria-modal="true" aria-labelledby="break-overlay-title">
      <div className={s.breakOverlay__card}>
        <h2 id="break-overlay-title" className={s.breakOverlay__title}>
          You are on break
        </h2>
        <p className={s.breakOverlay__type}>
          {BREAK_TYPE_LABELS[currentBreak.breakType]}
        </p>
        <p className={s.breakOverlay__timer}>
          {timeStr}
        </p>
        <p className={s.breakOverlay__hint}>
          You cannot use the app until you come back to work.
        </p>
        <button
          type="button"
          className={s.breakOverlay__btn}
          onClick={handleComeBack}
        >
          Come back to work
        </button>
      </div>
    </div>
  );
}
