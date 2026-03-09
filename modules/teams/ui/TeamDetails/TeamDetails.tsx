"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import type { TeamWithDetailsApi } from "@/config/api-types";
import s from "./TeamDetails.module.scss";
import iconCalendar from "../../assets/calendar.svg";

interface TeamDetailsProps {
  team: TeamWithDetailsApi;
  leadsCount?: number;
}

export function TeamDetails({ team, leadsCount }: TeamDetailsProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isFixed, setIsFixed] = useState(false);
  const startTopRef = useRef(0);

  useEffect(() => {
    if (!blockRef.current) return;
    startTopRef.current = blockRef.current.getBoundingClientRect().top + window.scrollY - 20;
    const handleScroll = () => setIsFixed(window.scrollY >= startTopRef.current);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const createdAt = new Date(team.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <div
      ref={blockRef}
      className={`${s.TeamDetails} ${isFixed ? s.TeamDetails_fixed : ""}`}
    >
      <div className={s.TeamDetails__contener}>
        <div className={s.TeamDetails__logo} />
        <h2 className={s.TeamDetails__title}>{team.name}</h2>
        <p className={s.TeamDetails__text}>{team.isActive ? "Active" : "Inactive"}</p>
      </div>
      <div className={s.TeamDetails__block}>
        <h2 className={s.TeamDetails__subtitle}>Overview</h2>
        <div className={s.TeamDetails__box}>
          <h3 className={s.TeamDetails__info}>Members</h3>
          <p className={s.TeamDetails__text}>{team.members?.length ?? 0}</p>
        </div>
        <div className={s.TeamDetails__box}>
          <h3 className={s.TeamDetails__info}>Leads</h3>
          <p className={s.TeamDetails__text}>{typeof leadsCount === "number" ? leadsCount : (team.leadAssignments?.length ?? 0)}</p>
        </div>
        <div className={s.TeamDetails__date}>
          <Image src={iconCalendar} width={19} height={20} alt="" />
          <span>Created {createdAt}</span>
        </div>
      </div>
    </div>
  );
}
