'use client';

import { useEffect, useRef, useState } from "react";
import s from "./LeadHistoryDetailsOwner.module.scss";
import { LEAD_STATUS_UI, LeadHistory, LeadStatus, useEmployeesStore } from "@/features";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";

interface LeadHistoryDetailsStatusProps {
    history: LeadHistory | null;
}

export function LeadHistoryDetailsOwner({ history }: LeadHistoryDetailsStatusProps) {
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
    const oldOwner = employees.find(e => e.id === history.oldValue);
    const newOwner = employees.find(e => e.id === history.newValue);

    return (
        <div
            ref={blockRef}
            className={`${s.LeadHistoryDetailsStatus} ${isFixed ? s.LeadHistoryDetailsStatus_fixed : ""}`}
        >
            <h3 className={s.LeadHistoryDetailsStatus__title}>{title}</h3>

            {/* New status */}
            <div className={s.LeadHistoryDetailsStatus__block}>
                <p className={s.LeadHistoryDetailsStatus__txt}>Now:</p>
                <div className={s.LeadHistoryDetailsStatus__profile}>
                    <div className={s.LeadHistoryDetailsStatus__image}>
                        {newOwner ? newOwner.firstName?.charAt(0) : "!"}
                    </div>
                    <p className={s.LeadHistoryDetailsStatus__name}>
                        {newOwner ? `${newOwner.firstName} ${newOwner.lastName}` : "Not assigned"}
                    </p>
                </div>
            </div>

            {/* Old status */}

            <div className={s.LeadHistoryDetailsStatus__block}>
                <p className={s.LeadHistoryDetailsStatus__txt}>Was:</p>
                <div className={s.LeadHistoryDetailsStatus__profile}>
                    <div className={s.LeadHistoryDetailsStatus__image}>
                        {oldOwner ? oldOwner.firstName?.charAt(0) : "!"}
                    </div>
                    <p className={s.LeadHistoryDetailsStatus__name}>
                        {oldOwner ? `${oldOwner.firstName} ${oldOwner.lastName}` : "Not assigned"}
                    </p>
                </div>
            </div>


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