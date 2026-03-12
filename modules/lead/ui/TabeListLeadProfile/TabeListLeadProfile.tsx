"use client";

import { ReactNode } from "react";
import s from "./TabeListLeadProfile.module.scss";

type Tab = {
  id: number;
  label: string;
  icon?: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: number;
  onChange: (tab: number) => void;
  children: ReactNode;
};

export function TabeListLeadProfile({
  tabs,
  activeTab,
  onChange,
  children,
}: TabsProps) {
  return (
    <>
      <div className={s.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={activeTab === tab.id ? s.tab_active : s.tab}
            type="button"
          >
            {tab.icon && <span className={s.tabIcon}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      <div className={s.content}>{children}</div>
    </>
  );
}