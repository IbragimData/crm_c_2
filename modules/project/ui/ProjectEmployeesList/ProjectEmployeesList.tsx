import { ProjectEmployeeItem, ProjectItem } from "@/components";
import s from "./ProjectEmployeesList.module.scss"

export function ProjectEmployeesList() {

    return (
        <div className={s.ProjectEmployeesList}>
            <ProjectEmployeeItem />
            <ProjectEmployeeItem />
        </div>
    );
}