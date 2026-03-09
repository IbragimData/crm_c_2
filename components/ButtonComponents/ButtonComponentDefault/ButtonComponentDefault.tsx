import React from "react";
import s from "./ButtonComponentDefault.module.scss"
type IconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    icon?: React.ReactNode;
    color: string,
    backgroundColor: string,
    iconPosition?: IconPosition;
}

export function ButtonComponentDefault({
    label,
    icon,
    color,
    backgroundColor,
    iconPosition = "right",
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            className={s.ButtonComponentDefault}
            style={{
                color,
                backgroundColor
            }}
        >
            {icon && iconPosition === "left" && <span>{icon}</span>}

            {label}

            {icon && iconPosition === "right" && <span>{icon}</span>}
        </button>
    );
}