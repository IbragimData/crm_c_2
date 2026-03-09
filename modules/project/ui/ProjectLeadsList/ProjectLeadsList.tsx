import {  ProjectLeadItem } from "@/components";
import s from "./ProjectLeadsList.module.scss"

export function ProjectLeadsList() {

    return (
        <div className={s.ProjectLeadsList}>
            <ProjectLeadItem />
            <ProjectLeadItem />
            <ProjectLeadItem />
        </div>
    );
}