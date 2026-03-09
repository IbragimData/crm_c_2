import Link from "next/link";
import s from "./ProjectLeadItem.module.scss"

export function ProjectLeadItem() {
    return (
        <Link href={"/leads/id"} className={s.ProjectLeadItem}>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Lead Name</p>
                <p className={s.ProjectLeadItem__txt}>Evan Yates</p>
            </div>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Phone</p>
                <p className={s.ProjectLeadItem__txt}>+1 555-123-4567</p>
            </div>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Сreate Data</p>
                <p className={s.ProjectLeadItem__txt}>14-Jan-2024 | 08:30 am</p>
            </div>
            <div className={s.ProjectLeadItem__content}>
                <p className={s.ProjectLeadItem__text}>Status</p>
                <p className={s.ProjectLeadItem__status}>New</p>
            </div>
            <div className={s.ProjectLeadItem__but}>
                <button>
                    Delete
                </button>
            </div>
        </Link>
    );
}