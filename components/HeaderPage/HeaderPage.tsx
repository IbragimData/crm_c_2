import React from "react";
import s from "./HeaderPage.module.scss"
type IconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    label?: string;
    icon?: React.ReactNode;
    color?: string;
    backgroundColor?: string;
    iconPosition?: IconPosition;
}

export function HeaderPage({
    title,
    label,
    icon,
    color,
    backgroundColor,
    iconPosition = "right",
    ...props
}: ButtonProps) {
    return (
        <div className={s.HeaderPage}>
            <h1 className={s.HeaderPage__title}>
                {title}
            </h1>
            {label != null && label !== "" && (
                <button
                    {...props}
                    className={s.HeaderPage__button}
                    style={{
                        color,
                        backgroundColor
                    }}
                >
                    {icon && iconPosition === "left" && <span>{icon}</span>}

                    {label}

                    {icon && iconPosition === "right" && <span>{icon}</span>}
                </button>
            )}
        </div>
    );
}