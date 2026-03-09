'use client'
import { AutoTextarea, ButtonComponentDefault, InputComponentTextDefault } from "@/components";
import s from "./ProjectMainInfo.module.scss";
import { useState } from "react";



export function ProjectMainInfo() {

    return (
        <div className={s.ProjectMainInfo}>
            <div className={s.ProjectMainInfo__content}>
                <h1 className={s.ProjectMainInfo__title}>Main info</h1>
                <div className={s.ProjectMainInfo__block}>
                    <div className={s.ProjectMainInfo__column}>
                        <InputComponentTextDefault label="Title" placeholder="title" />
                        <InputComponentTextDefault label="Team Leader" placeholder="User" />
                        <InputComponentTextDefault label="Created By" placeholder="User" />
                        <InputComponentTextDefault label="Team" placeholder="Team" />
                        <div className={s.ProjectMainInfo__box}>
                            <label className={s.ProjectMainInfo__label} htmlFor="">Status</label>
                            <button className={s.ProjectMainInfo__status} style={{
                                backgroundColor: "#0ac94752",
                                color: "#0AC947"
                            }}>
                                Active
                            </button>
                        </div>

                    </div>
                    <div className={s.ProjectMainInfo__column}>
                        <InputComponentTextDefault label="Phone" placeholder="Phone number" />
                        <InputComponentTextDefault label="Email" placeholder="Phone number" />
                        <InputComponentTextDefault label="Role" placeholder="Role" />
                        <InputComponentTextDefault disabled label="Last Login" placeholder="2 days ago" />
                    </div>
                </div>
            </div>
            <div className={s.ProjectMainInfo__buttons}>
                <button className={s.ProjectMainInfo__button}>
                    Save Unchanged
                </button>
                <ButtonComponentDefault label="Save Changes" color="#ffffff" backgroundColor="#3f8cff" />
            </div>
        </div>
    );
}