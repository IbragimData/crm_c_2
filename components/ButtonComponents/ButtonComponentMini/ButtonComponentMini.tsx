import React from "react";
import s from "./ButtonComponentMini.module.scss"
type IconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
}

export function ButtonComponentMain({
    icon, 
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            className={s.ButtonComponentMain}>


            {icon && icon}
        </button>
    );
}