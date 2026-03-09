"use client";

import { useEffect, useRef, useState } from "react";
import { Employee } from "../../../../features/auth/types"
import s from "./EmployeeDetails.module.scss";
import Image from "next/image";
import iconCalendar from "../../assets/calendar.svg"
interface EmployeeDetailsProps {
    employee: Employee;
}

export function EmployeeDetails({ employee }: EmployeeDetailsProps) {
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);

    useEffect(() => {
        if (!blockRef.current) return;

        startTopRef.current =
            blockRef.current.getBoundingClientRect().top + window.scrollY - 20;

        const handleScroll = () => setIsFixed(window.scrollY >= startTopRef.current);

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    const createdAt = new Date(employee.createdAt).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
        }
    );

    const shortId = employee.id.slice(0, 8);

    return (
        <div
            ref={blockRef}
            className={`${s.EmployeeDetails} ${isFixed ? s.EmployeeDetails_fixed : ""}`}
        >
            <div className={s.EmployeeDetails__content}>
                <p className={s.EmployeeDetails__id}>Employee&apos;s id</p>
                <p className={s.EmployeeDetails__textid}>{shortId}</p>
            </div>

            <div className={s.EmployeeDetails__contener}>
                <div className={s.EmployeeDetails__profile}>
                    <div className={s.EmployeeDetails__logo}>
                        {employee.avatarUrl ? (
                            <img src={employee.avatarUrl} alt={employee.firstName} />
                        ) : (
                            <div className={s.EmployeeDetails__placeholder}>
                                {employee.firstName?.charAt(0) || "?"}
                            </div>
                        )}
                    </div>
                    <div className={s.EmployeeDetails__column}>
                        <h2 className={s.EmployeeDetails__title}>
                            {employee.firstName} {employee.lastName}
                        </h2>
                        <p className={s.EmployeeDetails__role}>
                            {employee.role}
                            {employee.department && ` · ${employee.department}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className={s.EmployeeDetails__block}>
                <h2 className={s.EmployeeDetails__subtitle}>Contact Info</h2>

                <div className={s.EmployeeDetails__box}>
                    <h3 className={s.EmployeeDetails__info}>Email</h3>
                    <p className={s.EmployeeDetails__text}>
                        {employee.detailsMasked ? "••••••" : employee.email}
                    </p>
                </div>

                <div className={s.EmployeeDetails__box}>
                    <h3 className={s.EmployeeDetails__info}>Telegram</h3>
                    <p className={s.EmployeeDetails__text}>
                        {employee.detailsMasked ? "••••••" : (employee.telegramUsername || "-")}
                    </p>
                </div>

                <div className={s.EmployeeDetails__date}>
                    <Image
                        src={iconCalendar}
                        width={19}
                        height={20}
                        alt="icon calendar"
                    />
                    <span>Created {createdAt}</span>
                </div>
            </div>
        </div>
    );
}