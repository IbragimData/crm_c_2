import { HeaderPage } from '@/components';
import iconAdd from "../../assets/add.svg"
import s from './ProjectPage.module.scss'
import Image from 'next/image';
import { ProjectsList } from '../ProjectsList';

export function ProjectPage() {
    return (
        <div className={s.ProjectPage}>

            <HeaderPage title="Projects" icon={<Image src={iconAdd} width={14} height={14} alt="ad" />} label="Create New Project" backgroundColor="#00f5ff" color="#0d0d12" iconPosition="left" />
            <div className={s.ProjectPage__head}>
                <h3 className={s.ProjectPage__subtitle}>
                    Projects List
                </h3>
            </div>
            <ProjectsList />
        </div>
    );
}