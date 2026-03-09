'use client'
import { AffiliatorPage } from "@/modules/affiliator/ui/AffiliatorPage/AffiliatorPage";
import s from "./page.module.scss"
export default function Page() {
    return (
        <div className={s.main}>
            <AffiliatorPage />
        </div>
    );
}