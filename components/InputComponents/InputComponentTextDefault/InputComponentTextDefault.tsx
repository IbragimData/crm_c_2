import React, { useId } from "react";
import s from "./InputComponentTextDefault.module.scss"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function InputComponentTextDefault({ label, id, ...props }: InputProps) {
    const reactId = useId();
    const inputId = id ?? reactId;

    return (
        <div className={s.InputComponentTextDefault}>
            {label && (
                <label
                    className={s.InputComponentTextDefault__label}
                    htmlFor={inputId}
                >
                    {label}
                </label>
            )}

            <input
                className={s.InputComponentTextDefault__input}
                id={inputId}
                {...props}
            />
        </div>
    );
}