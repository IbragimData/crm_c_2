"use client";

import Image from "next/image";
import Link from "next/link";
import type { TeamWithDetailsApi } from "@/config/api-types";
import s from "./TeamItem.module.scss";
import iconCalendar from "../../assets/calendar.svg";

type Props = {
  team: TeamWithDetailsApi;
};

export function TeamItem({ team }: Props) {
  const createdAt = new Date(team.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <Link href={`/teams/${team.id}`} className={s.TeamItem}>
      <div className={s.TeamItem__contener}>
        <div className={s.TeamItem__block}>
          <div className={s.TeamItem__logo} />
          <div className={s.TeamItem__info}>
            <h3>{team.name}</h3>
            <p>{team.isActive ? "Active" : "Inactive"}</p>
          </div>
        </div>
        <div className={s.TeamItem__date}>
          <Image src={iconCalendar} width={19} height={20} alt="" />
          <span>Created {createdAt}</span>
        </div>
      </div>
      <div className={s.TeamItem__content}>
        <h4>Team data</h4>
        <div className={s.TeamItem__boxes}>
          <div className={s.TeamItem__box}>
            <p className={s.TeamItem__text}>Members</p>
            <p className={s.TeamItem__txt}>{team.members?.length ?? 0}</p>
          </div>
          <div className={s.TeamItem__box}>
            <p className={s.TeamItem__text}>Leads</p>
            <p className={s.TeamItem__txt}>{team.leadAssignments?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
