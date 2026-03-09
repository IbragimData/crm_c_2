
import Image from "next/image";
import s from "./NoteItem.module.scss"
import iconCalendar from "../../assets/calendar.svg"
import { formatLeadDate } from "@/features/auth/constants/format-lead-date";
import { LeadNote } from "@/features/note/types";
import { useEmployee, useEmployeesStore } from "@/features";

export interface NoteItemProps {
    note: LeadNote
}
export function NoteItem({ note }: NoteItemProps) {
    const { employees } = useEmployeesStore()

    const currentOwner = employees.find(e => e.id === note.createdBy);
    return (
        <div className={s.NoteItem}>
            <p className={s.NoteItem__text}>{note.content}</p>
            <div className={s.NoteItem__block}>
                <div className={s.NoteItem__date}>
                    <Image
                        src={iconCalendar}
                        width={19}
                        height={20}
                        alt="icon calendar"
                    />
                    <p>
                        {
                            formatLeadDate(note.createdAt)
                        }

                    </p>
                </div>
                <div className={s.NoteItem__content}>
                    <p className={s.NoteItem__subtitle}>Changed by:</p>
                    <div className={s.NoteItem__profile}>
                        <div className={s.NoteItem__image}>
                            {currentOwner ? currentOwner.firstName?.charAt(0) : "!"}
                        </div>
                        <p className={s.NoteItem__name}>
                            {currentOwner ? `${currentOwner.firstName} ${currentOwner.lastName}` : "Not assigned"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}