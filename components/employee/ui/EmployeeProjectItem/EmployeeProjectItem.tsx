import Image from "next/image";
import iconCalendar from "../../assets/calendar.svg"
import s from "./EmployeeProjectItem.module.scss"
export function EmployeeProjectItem() {
    return (
        <div className={s.EmployeeProjectItem}>
            <div className={s.EmployeeProjectItem__contener} >
                <div className={s.EmployeeProjectItem__block}>
                    <div className={s.EmployeeProjectItem__logo}>
                    </div>
                    <div className={s.EmployeeProjectItem__info}>
                        <p>PN0001265</p>
                        <h3>Franch Time</h3>
                    </div>
                </div>
                <div className={s.EmployeeProjectItem__date}>
                    <Image src={iconCalendar} width={19} height={20} alt="icon calendar" />
                    <span>Created Sep 12, 2020</span>
                </div>
            </div>
            <div className={s.EmployeeProjectItem__content}>
                <h4>Project Data</h4>
                <div className={s.EmployeeProjectItem__boxes}>
                    <div className={s.EmployeeProjectItem__box}>
                        <p className={s.EmployeeProjectItem__text}>New Lead</p>
                        <p className={s.EmployeeProjectItem__txt}>24</p>
                    </div>
                    <div className={s.EmployeeProjectItem__box}>
                        <p className={s.EmployeeProjectItem__text}>All Lead</p>
                        <p className={s.EmployeeProjectItem__txt}>1200</p>
                    </div>
                    <div className={s.EmployeeProjectItem__box}>
                        <p className={s.EmployeeProjectItem__text}>Active Agent</p>
                        <p className={s.EmployeeProjectItem__txt}>13</p>
                    </div>
                </div>
            </div>
        </div>
    );
}