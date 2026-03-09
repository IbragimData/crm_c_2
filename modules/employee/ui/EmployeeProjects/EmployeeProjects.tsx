import { EmployeeProjectItem } from "@/components";
import s from "./EmployeeProjects.module.scss"

export function EmployeeProjects() {
    return (
        <div className={s.EmployeeProjects}>
            <h1 className={s.EmployeeProjects__title}>Projects</h1>
            <div className={s.EmployeeProjects__list}>
                <EmployeeProjectItem />
                <EmployeeProjectItem />
            </div>
        </div>
    );
}