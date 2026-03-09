"use client";

import { useEffect, useRef, useState } from "react";
import s from "./ProjectDetails.module.scss";
import Image from "next/image";
import iconCalendar from '../../assets/calendar.svg'
export function ProjectDetails() {
    const blockRef = useRef<HTMLDivElement | null>(null);
    const startTopRef = useRef<number>(0);
    const [isFixed, setIsFixed] = useState(false);

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

    return (
        <div
            ref={blockRef}
            className={`${s.ProjectDetails} ${isFixed ? s.ProjectDetails_fixed : ""}`}
        >
            <div className={s.ProjectDetails__contener}>
                <div className={s.ProjectDetails__logo}>

                </div>
                <h2 className={s.ProjectDetails__title}>French Team</h2>
            </div>

            <div className={s.ProjectDetails__box}>
                <h3 className={s.ProjectDetails__info}>All Leads</h3>
                <p className={s.ProjectDetails__text}>1200</p>
            </div>

            <div className={s.ProjectDetails__content}>
                <div className={s.ProjectDetails__id}>Team Lead</div>
                <div className={s.ProjectDetails__profile}>
                    <div className={s.ProjectDetails__image}>M</div>
                    <p className={s.ProjectDetails__name}>Evan Yates</p>
                </div>
            </div>
            <div className={s.ProjectDetails__block}>
                <Image src={iconCalendar} width={20} height={20} alt="ad" />
                <p>Created Sep 12, 2020</p>
            </div>

        </div>
    );
}