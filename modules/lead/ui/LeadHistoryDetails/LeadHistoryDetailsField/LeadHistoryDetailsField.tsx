'use client';

import { useEffect, useRef, useState } from "react";
import s from "./LeadHistoryDetailsField.module.scss";
import { LEAD_STATUS_UI, LeadHistory, LeadStatus, useEmployeesStore } from "@/features";
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";

interface LeadHistoryDetailsFieldProps {
    history: LeadHistory | null;
}

export function LeadHistoryDetailsField({ history }: LeadHistoryDetailsFieldProps) {
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
                className={`${s.LeadHistoryDetailsField} ${isFixed ? s.LeadHistoryDetailsField_fixed : ""}`}
            >
                <p className={s.LeadHistoryDetailsField__title}>Select a history item to see details</p>
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
            className={`${s.LeadHistoryDetailsField} ${isFixed ? s.LeadHistoryDetailsField_fixed : ""}`}
        >
            <h3 className={s.LeadHistoryDetailsField__title}>{title}</h3>



            {history.field &&
                <div className={s.LeadHistoryDetailsField__content}>
                    <p className={s.LeadHistoryDetailsField__subtitle}>Field:</p>
                    <p className={s.LeadHistoryDetailsField__txt}>
                        {history.field}

                    </p>
                </div>

            }

            {/* New status */}
            <div className={s.LeadHistoryDetailsField__block}>
                <p className={s.LeadHistoryDetailsField__txt}>Now:</p>
                <div>
                    <div
                        className={s.LeadHistoryDetailsField__text} >
                        {
                            history.newValue
                        }
                    </div>
                </div>
            </div>

            {/* Old status */}

            <div className={s.LeadHistoryDetailsField__block}>
                <p className={s.LeadHistoryDetailsField__txt}>Was:</p>
                <div>
                    <div
                        className={s.LeadHistoryDetailsField__text} >
                        {
                            history.oldValue
                        }
                    </div>
                </div>
            </div>


            <div className={s.LeadHistoryDetailsField__content}>
                <p className={s.LeadHistoryDetailsField__subtitle}>Changed by:</p>
                <div className={s.LeadHistoryDetailsField__profile}>
                    <div className={s.LeadHistoryDetailsField__image}>
                        {currentOwner ? currentOwner.firstName?.charAt(0) : "!"}
                    </div>
                    <p className={s.LeadHistoryDetailsField__name}>
                        {currentOwner ? `${currentOwner.firstName} ${currentOwner.lastName}` : "Not assigned"}
                    </p>
                </div>
            </div>

            <p className={s.LeadHistoryDetailsField__date}>
                Created at: {formatLeadDate(history.createdAt)}
            </p>
        </div>
    );
}