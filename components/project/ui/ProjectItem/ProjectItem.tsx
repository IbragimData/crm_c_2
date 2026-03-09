import Image from "next/image";
import iconCalendar from "../../assets/calendar.svg"
import s from "./ProjectItem.module.scss"
import Link from "next/link";
export function ProjectItem() {
    return (
        <Link href={"/projects/id1"} className={s.ProjectItem}>
            <div className={s.ProjectItem__contener} >
                <div className={s.ProjectItem__block}>
                    <div className={s.ProjectItem__logo}>
                    </div>
                    <div className={s.ProjectItem__info}>
                        <p>PN0001265</p>
                        <h3>Franch Time</h3>
                    </div>
                </div>
                <div className={s.ProjectItem__date}>
                    <Image src={iconCalendar} width={19} height={20} alt="icon calendar" />
                    <span>Created Sep 12, 2020</span>
                </div>
            </div>
            <div className={s.ProjectItem__content}>
                <h4>Project Data</h4>
                <div className={s.ProjectItem__boxes}>
                    <div className={s.ProjectItem__box}>
                        <p className={s.ProjectItem__text}>New Lead</p>
                        <p className={s.ProjectItem__txt}>24</p>
                    </div>
                    <div className={s.ProjectItem__box}>
                        <p className={s.ProjectItem__text}>All Lead</p>
                        <p className={s.ProjectItem__txt}>1200</p>
                    </div>
                    <div className={s.ProjectItem__box}>
                        <p className={s.ProjectItem__text}>Active Agent</p>
                        <p className={s.ProjectItem__txt}>13</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}