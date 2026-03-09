import { ProjectLeadsList } from '../ProjectLeadsList';
import s from './ProjectLeads.module.scss'
export function ProjectLeads() {
    return (
        <div className={s.ProjectEmployees}>
            <div className={s.ProjectEmployees__block}>
                <span>
                    New
                </span>
            </div>
            < ProjectLeadsList />
        </div>
    );
}