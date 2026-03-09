'use client';
import s from "./LeadHistoryItem.module.scss";
import classNames from "classnames";

interface LeadHistoryItemProps {
    icon?: React.ReactNode;
    title: string;
    time?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function LeadHistoryItem({ icon, title, time, isActive, onClick }: LeadHistoryItemProps) {
    return (
        <div className={s.LeadHistoryItem} onClick={onClick}>
            <div
                className={classNames(s.LeadHistoryItem__content, {
                    [s.LeadHistoryItem__content_active]: isActive,
                })}
            >
                {icon && <span className={s.icon}>{icon}</span>}
                <h3 className={s.LeadHistoryItem__title}>{title}</h3>
                {time && (
                    <div className={s.LeadHistoryItem__time}>
                        <p className={s.LeadHistoryItem__text}>Time</p>
                        <span>{time}</span>
                    </div>
                )}
            </div>

            <div
                className={classNames(s.LeadHistoryItem__block, {
                    [s.LeadHistoryItem__block_active]: isActive,
                })}
            />
        </div>
    );
}