"use client";

import { useState, useEffect } from "react";
import { useAttendanceStore } from "../../store/useAttendanceStore";
import s from "./AttendanceControl.module.scss";

interface AttendanceControlProps {
  employeeId: string;
  employeeName: string;
}

export function AttendanceControl({ employeeId, employeeName }: AttendanceControlProps) {
  const currentShift = useAttendanceStore((s) => s.currentShift);
  const startWork = useAttendanceStore((s) => s.startWork);
  const finishWork = useAttendanceStore((s) => s.finishWork);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);

  useEffect(() => {
    if (!currentShift) return;
    const start = new Date(currentShift.startedAt).getTime();
    const update = () => setElapsedMinutes(Math.floor((Date.now() - start) / 60000));
    update();
    const interval = setInterval(update, 60000); // every minute
    return () => clearInterval(interval);
  }, [currentShift]);

  const handleStartWorkClick = () => {
    setConfirmStart(true);
  };

  const handleConfirmStart = async () => {
    try {
      await startWork(employeeId, employeeName);
      setConfirmStart(false);
    } catch {
      // Error shown in header
    }
  };

  const handleCancelStart = () => {
    setConfirmStart(false);
  };

  const handleFinishWorkClick = () => {
    setConfirmEnd(true);
  };

  const handleConfirmEnd = async () => {
    try {
      await finishWork();
      setConfirmEnd(false);
    } catch {
      // Error shown in header
    }
  };

  const handleCancelEnd = () => {
    setConfirmEnd(false);
  };

  if (currentShift) {
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    const timeStr = `${hours}h ${mins}m`;
    return (
      <div className={s.attendanceControl}>
        <span className={s.attendanceControl__elapsed}>{timeStr}</span>
        {confirmEnd ? (
          <div className={s.attendanceControl__confirm}>
            <span className={s.attendanceControl__confirmLabel}>End shift?</span>
            <div className={s.attendanceControl__confirmActions}>
              <button
                type="button"
                className={s.attendanceControl__btnCancel}
                onClick={handleCancelEnd}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                className={s.attendanceControl__btnConfirmEnd}
                onClick={handleConfirmEnd}
                aria-label="End shift"
              >
                End shift
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={s.attendanceControl__btnFinished}
            onClick={handleFinishWorkClick}
            aria-label="Finish work"
          >
            Finished work
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {confirmStart ? (
        <div className={s.attendanceControl}>
          <span className={s.attendanceControl__confirmLabel}>Start shift?</span>
          <div className={s.attendanceControl__confirmActions}>
            <button
              type="button"
              className={s.attendanceControl__btnCancel}
              onClick={handleCancelStart}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              className={s.attendanceControl__btnConfirmStart}
              onClick={handleConfirmStart}
              aria-label="Start shift"
            >
              Start shift
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={s.attendanceControl__btnStart}
          onClick={handleStartWorkClick}
          aria-label="Start work"
        >
          Start work
        </button>
      )}
    </>
  );
}
