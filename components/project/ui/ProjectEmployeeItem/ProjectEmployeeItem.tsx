import Link from "next/link";
import s from "./ProjectEmployeeItem.module.scss"

export function ProjectEmployeeItem() {
    return (
        <Link href={"/employees/id"} className={s.ProjectEmployeeItem}>
            <div className={s.ProjectEmployeeItem__contener}>
                <div className={s.ProjectEmployeeItem__logo}>

                </div>
                <div className={s.ProjectEmployeeItem__content}>
                    <h3>Evan Yates</h3>
                    <p className={s.ProjectEmployeeItem__text}>evanyates@gmail.com</p>
                </div>
            </div>
            <div className={s.ProjectEmployeeItem__content}>
                <p className={s.ProjectEmployeeItem__text}>Last Login</p>
                <p className={s.ProjectEmployeeItem__txt}>2 days ago</p>
            </div>
            <div className={s.ProjectEmployeeItem__content}>
                <p className={s.ProjectEmployeeItem__text}>Status</p>
                <p className={s.ProjectEmployeeItem__status}>Active</p>
            </div>
            <div className={s.ProjectEmployeeItem__content}>
                <p className={s.ProjectEmployeeItem__text}>Role</p>
                <p className={s.ProjectEmployeeItem__txt}>Admin</p>
            </div>
            <div className={s.ProjectEmployeeItem__but}>
                <button>
                    Delete
                </button>
            </div>
        </Link>
    );
}