"use client";

import { useEffect, useRef, useState } from "react";
import s from "./LeadDetails.module.scss";
import iconCalendar from "../../assets/calendar.svg"
import Image from "next/image";
import { Lead } from "@/features/lead/types";
import { useEmployeesStore } from "@/features";
interface LeadDetailsProps {
    lead: Lead;
}
export function LeadDetails({ lead }: LeadDetailsProps) {
    const { employees, loading } = useEmployeesStore();
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);

    const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
    const currentOwner = employees.find(
        e => e.id === lead.leadOwnerId
    );




    useEffect(() => {
        if (!blockRef.current) return;


        // Запоминаем начальное положение блока
        startTopRef.current =
            blockRef.current.getBoundingClientRect().top + window.scrollY - 20;

        const handleScroll = () => {
            if (window.scrollY >= startTopRef.current) {
                setIsFixed(true);
            } else {
                setIsFixed(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const createdAt = new Date(lead.createdAt).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
        }
    )

    type Props = {
        text: string
        maxLength?: number
    }

    function TruncatedText({ text, maxLength = 320 }: Props) {
        const truncated =
            text.length > maxLength
                ? text.slice(0, maxLength) + "…"
                : text

        return truncated
    }

    return (
        <div
            ref={blockRef}
            className={`${s.LeadDetails} ${isFixed ? s.LeadDetails_fixed : ""}`}
        >
            <div className={s.LeadDetails__content}>
                <p className={s.LeadDetails__id}>Lead’s id</p>
                <p className={s.LeadDetails__textid}>{lead.shortId ? lead.shortId : lead.id}</p>
            </div>

            <div className={s.LeadDetails__box}>
                <h3 className={s.LeadDetails__info}>Name</h3>
                <p className={s.LeadDetails__text}>{lead.firstName} {lead.lastName}</p>
            </div>

            <div className={s.LeadDetails__box}>
                <h3 className={s.LeadDetails__info}>Description</h3>
                <p className={s.LeadDetails__text}>
                    {lead.description ? TruncatedText({ text: lead.description }) : "-"}
                </p>
            </div>

            <div className={s.LeadDetails__content}>
                <div className={s.LeadDetails__id}>Lead Owner</div>
                <div className={s.LeadDetails__profile}>
                    <div className={s.LeadDetails__image}>{currentOwner ? currentOwner.firstName?.charAt(0) : "!"}</div>
                    <p className={s.LeadDetails__name}>{currentOwner ? `${currentOwner?.firstName} ${currentOwner?.lastName}` : "Not assigned"}</p>
                </div>
            </div>
            <div className={s.LeadDetails__date}>
                <Image
                    src={iconCalendar}
                    width={19}
                    height={20}
                    alt="icon calendar"
                />
                <span>Created {createdAt}</span>
            </div>
        </div>
    );
}