"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import s from "./LeadDetails.module.scss";
import iconCalendar from "../../assets/calendar.svg"
import Image from "next/image";
import Link from "next/link";
import { Lead } from "@/features/lead/types";
import { useEmployeesStore } from "@/features";
import { AFFILIATOR_NAME_UI, AffiliatorName } from "@/features/affiliator/constants/affiliator.enum";
import { Role } from "@/features/auth/types";

interface LeadDetailsProps {
    lead: Lead;
}

function getAffiliatorKey(firstName: string | undefined, lastName: string | undefined): AffiliatorName {
    const fullName = `${firstName || ""}${lastName || ""}`;
    switch (fullName) {
        case AffiliatorName.LexoraCA_EN: return AffiliatorName.LexoraCA_EN;
        case AffiliatorName.LexoraCA_FR: return AffiliatorName.LexoraCA_FR;
        case AffiliatorName.LexoraFrench: return AffiliatorName.LexoraFrench;
        case AffiliatorName.BacaCA_EN: return AffiliatorName.BacaCA_EN;
        case AffiliatorName.BacaCA_FR: return AffiliatorName.BacaCA_FR;
        default: return AffiliatorName.no;
    }
}

function statusGlowRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function LeadDetails({ lead }: LeadDetailsProps) {
    const { employees } = useEmployeesStore();
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);

    const currentOwner = employees.find(e => e.id === lead.leadOwnerId);

    const affiliateItems = useMemo(() => {
        const byId = new Map<string, { name: string; date: Date; employeeId: string }>();
        if (lead.createdBy) {
            const creator = employees.find(e => e.id === lead.createdBy);
            if (creator) {
                const createdAt = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
                byId.set(creator.id, { name: `${creator.firstName} ${creator.lastName}`, date: createdAt, employeeId: creator.id });
            }
        }
        (lead.leadAffiliates || []).forEach(la => {
            const emp = employees.find(e => e.id === la.affiliateId);
            if (!emp) return;
            const date = la.createdAt instanceof Date ? la.createdAt : new Date(la.createdAt);
            const existing = byId.get(emp.id);
            if (!existing || date.getTime() < existing.date.getTime()) {
                byId.set(emp.id, { name: `${emp.firstName} ${emp.lastName}`, date, employeeId: emp.id });
            }
        });
        return Array.from(byId.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [lead.createdBy, lead.createdAt, lead.leadAffiliates, employees]);




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

            <div className={s.LeadDetails__content}>
                <div className={s.LeadDetails__id}>Lead Owner</div>
                <div className={s.LeadDetails__profile}>
                    <div className={s.LeadDetails__image}>{currentOwner ? currentOwner.firstName?.charAt(0) : "!"}</div>
                    <p className={s.LeadDetails__name}>{currentOwner ? `${currentOwner?.firstName} ${currentOwner?.lastName}` : "Not assigned"}</p>
                </div>
            </div>

            <div className={s.LeadDetails__affiliates}>
                {affiliateItems.length === 0 ? (
                    <div className={s.LeadDetails__affiliatesEmpty}>
                        <span className={s.LeadDetails__affiliatesEmptyIcon}>—</span>
                        No affiliates
                    </div>
                ) : (
                    <div className={s.LeadDetails__affiliatesGrid}>
                        {affiliateItems.map((item) => {
                            const employee = employees.find(e => e.id === item.employeeId);
                            const href = employee?.role === Role.AFFILIATOR
                                ? `/affiliator/${item.employeeId}`
                                : `/employees/${item.employeeId}`;
                            const affiliatorKey = employee ? getAffiliatorKey(employee.firstName, employee.lastName) : AffiliatorName.no;
                            const cardColor = AFFILIATOR_NAME_UI[affiliatorKey].bg;
                            return (
                                <Link
                                    key={item.employeeId}
                                    href={href}
                                    className={s.LeadDetails__affiliateCard}
                                    style={{
                                        ['--card-glow' as string]: statusGlowRgba(cardColor, 0.45),
                                        ['--card-border' as string]: statusGlowRgba(cardColor, 0.6),
                                    }}
                                >
                                    <div className={s.LeadDetails__affiliateCardAvatar}>
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={s.LeadDetails__affiliateCardBody}>
                                        <span className={s.LeadDetails__affiliateCardName}>{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
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