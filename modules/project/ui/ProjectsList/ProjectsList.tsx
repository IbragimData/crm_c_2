import { ProjectItem } from "@/components";
import s from "./ProjectsList.module.scss"

export function ProjectsList() {
    return (
        <div className={s.ProjectsList}>
            <ProjectItem />
            <ProjectItem />
        </div>
    );
}