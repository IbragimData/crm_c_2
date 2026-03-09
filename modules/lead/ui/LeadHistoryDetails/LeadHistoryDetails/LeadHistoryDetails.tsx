'use client';

import { useEffect, useRef, useState } from "react";
import s from "./LeadHistoryDetails.module.scss";
import { LeadHistory } from "@/features";
import { LeadHistoryDetailsOwner } from "../LeadHistoryDetailsOwner";
import { LeadHistoryDetailsStatus } from "../LeadHistoryDetailsStatus";
import { LeadHistoryDetailsField } from "../LeadHistoryDetailsField";

interface LeadHistoryDetailsNoteProps {
    history: LeadHistory | null;
    selectedHistory: LeadHistory | null
}

export function LeadHistoryDetails({ history, selectedHistory }: LeadHistoryDetailsNoteProps) {
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);

    useEffect(() => {
        if (!blockRef.current) return;

        startTopRef.current = blockRef.current.getBoundingClientRect().top + window.scrollY - 20;

        const handleScroll = () => {
            setIsFixed(window.scrollY >= startTopRef.current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const renderDetails = () => {
        if (!selectedHistory) return null;

        switch (selectedHistory.action) {
            case "OWNER_CHANGED":
                return <LeadHistoryDetailsOwner history={selectedHistory} />;

            case "STATUS_CHANGED":
                return <LeadHistoryDetailsStatus history={selectedHistory} />;

            case "FIELD_UPDATED":
                return <LeadHistoryDetailsField history={selectedHistory} />;
            default:
                return null;
        }
    };

    if (!selectedHistory) {
        return <div ref={blockRef} className={`${s.LeadHistoryDetailsNote} ${isFixed ? s.LeadHistoryDetailsNote_fixed : ""}`}>

        </div>;
    }

    return (
        <div ref={blockRef} className={`${s.LeadHistoryDetailsNote} ${isFixed ? s.LeadHistoryDetailsNote_fixed : ""}`}>
            {renderDetails()}
        </div>
    );
}