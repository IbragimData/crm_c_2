import Image from "next/image"
import iconCalendar from "../../assets/calendar.svg"
import s from "./AffiliatorItem.module.scss"
import Link from "next/link"
import { Employee } from "@/features/auth/types"

type Props = {
    employee: Employee
}

export function AffiliatorItem({ employee }: Props) {
    const fullName = `${employee.firstName} ${employee.lastName}`

    const createdAt = new Date(employee.createdAt).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "2-digit",
        }
    )

    return (
        <Link
            href={`/affiliator/${employee.id}`}
            className={s.AffiliatorItem}
        >
            <div className={s.AffiliatorItem__contener}>
                <div className={s.AffiliatorItem__block}>
                    <div className={s.AffiliatorItem__logo}>
                        {/* если будет avatar */}
                        {employee.avatarUrl && (
                            <Image
                                src={employee.avatarUrl}
                                alt={fullName}
                                width={40}
                                height={40}
                            />
                        )}
                    </div>

                    <div className={s.AffiliatorItem__info}>
                        <h3>{fullName}</h3>
                        <p>{employee.email}</p>
                    </div>
                </div>

                <div className={s.AffiliatorItem__date}>
                    <Image
                        src={iconCalendar}
                        width={19}
                        height={20}
                        alt="icon calendar"
                    />
                    <span>Created {createdAt}</span>
                </div>
            </div>

            <div className={s.AffiliatorItem__content}>
                <h4>Affiliator Data</h4>

                <div className={s.AffiliatorItem__boxes}>
                    <div className={s.AffiliatorItem__box}>
                        <p className={s.AffiliatorItem__text}>
                            New Lead
                        </p>
                        <p className={s.AffiliatorItem__txt}>—</p>
                    </div>

                    <div className={s.AffiliatorItem__box}>
                        <p className={s.AffiliatorItem__text}>
                            All Lead
                        </p>
                        <p className={s.AffiliatorItem__txt}>—</p>
                    </div>
                </div>
            </div>
        </Link>
    )
}