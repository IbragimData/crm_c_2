import { ProjectEmployeesList } from "../ProjectEmployeesList";
import s from "./ProjectEmployees.module.scss"

export function ProjectEmployees() {
    return (
        <div className={s.ProjectEmployees}>
            <div className={s.ProjectEmployees__block}>
                <span>
                    Team Lead
                </span>
            </div>
            <ProjectEmployeesList />
        </div>
    );
}