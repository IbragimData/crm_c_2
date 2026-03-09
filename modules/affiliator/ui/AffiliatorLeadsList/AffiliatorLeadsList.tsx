import { AffiliatorLeadItem, ProjectLeadItem } from "@/components";
import s from "./AffiliatorLeadsList.module.scss"
import { Lead } from "@/features";
import { Dispatch, SetStateAction } from "react";

interface AffiliatorLeadsListProps {
    leads: Lead[];
    activeLeads: string[];
    setActiveLeads: Dispatch<SetStateAction<string[]>>;
}
export function AffiliatorLeadsList({ leads, activeLeads, setActiveLeads }: AffiliatorLeadsListProps) {

    return (
        <div className={s.AffiliatorLeads}>
            {
                leads.map((i: Lead) => (
                    <AffiliatorLeadItem lead={i} setActiveLeads={setActiveLeads} activeLeads={activeLeads} />
                ))
            }
        </div>
    );
}