'use client';

import { useEffect, useRef, useState } from "react";
import s from "./LeadHistoryDetailsStatus.module.scss";
import { LEAD_STATUS_UI, LeadHistory, LeadStatus, useEmployeesStore } from "@/features";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";

interface LeadHistoryDetailsStatusProps {
    history: LeadHistory | null;
}

export function LeadHistoryDetailsStatus({ history }: LeadHistoryDetailsStatusProps) {
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);
    const { employees } = useEmployeesStore();
    // Scroll handler для фиксированного блока
    useEffect(() => {
        if (!blockRef.current) return;

        startTopRef.current = blockRef.current.getBoundingClientRect().top + window.scrollY - 20;

        const handleScroll = () => {
            setIsFixed(window.scrollY >= startTopRef.current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!history) {
        return (
            <div
                ref={blockRef}
                className={`${s.LeadHistoryDetailsStatus} ${isFixed ? s.LeadHistoryDetailsStatus_fixed : ""}`}
            >
                <p className={s.LeadHistoryDetailsStatus__title}>Select a history item to see details</p>
            </div>
        );
    }

    // Безопасно приводим к типу LeadStatus
    const oldStatus = history.oldValue as LeadStatus | undefined;
    const newStatus = history.newValue as LeadStatus | undefined;
    const title = history.action.split("_").map(w => w[0] + w.slice(1).toLowerCase()).join(" ");

    const currentOwner = employees.find(e => e.id === history.changedBy);

    return (
        <div
            ref={blockRef}
            className={`${s.LeadHistoryDetailsStatus} ${isFixed ? s.LeadHistoryDetailsStatus_fixed : ""}`}
        >
            <h3 className={s.LeadHistoryDetailsStatus__title}>{title}</h3>

            {history.field && <p>Field: {history.field}</p>}

            {/* New status */}
            {newStatus && LEAD_STATUS_UI[newStatus] && (
                <div className={s.LeadHistoryDetailsStatus__block}>
                    <p className={s.LeadHistoryDetailsStatus__txt}>Now</p>
                    <div
                        className={s.LeadHistoryDetailsStatus__status}
                        style={{
                            backgroundColor: LEAD_STATUS_UI[newStatus].bg,
                            color: LEAD_STATUS_UI[newStatus].text,
                        }}
                    >
                        {LEAD_STATUS_UI[newStatus].label}
                    </div>
                </div>
            )}

            {/* Old status */}
            {oldStatus && LEAD_STATUS_UI[oldStatus] && (
                <div className={s.LeadHistoryDetailsStatus__block}>
                    <p className={s.LeadHistoryDetailsStatus__txt}>Was</p>
                    <div>
                        <div
                            className={s.LeadHistoryDetailsStatus__status}
                            style={{
                                backgroundColor: LEAD_STATUS_UI[oldStatus].bg,
                                color: LEAD_STATUS_UI[oldStatus].text,
                            }}
                        >
                            {LEAD_STATUS_UI[oldStatus].label}
                        </div>
                    </div>
                </div>
            )}

            <div className={s.LeadHistoryDetailsStatus__content}>
                <p className={s.LeadHistoryDetailsStatus__subtitle}>Changed by:</p>
                <div className={s.LeadHistoryDetailsStatus__profile}>
                    <div className={s.LeadHistoryDetailsStatus__image}>
                        {currentOwner ? currentOwner.firstName?.charAt(0) : "!"}
                    </div>
                    <p className={s.LeadHistoryDetailsStatus__name}>
                        {currentOwner ? `${currentOwner.firstName} ${currentOwner.lastName}` : "Not assigned"}
                    </p>
                </div>
            </div>

            <p className={s.LeadHistoryDetailsStatus__date}>
                Created at: {formatLeadDate(history.createdAt)}
            </p>
        </div>
    );
}