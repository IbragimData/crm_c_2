"use client"
import { useRoleGuard } from "@/features/auth/hooks";
import { Role } from "@/features/auth/types";

export default function Layout({children}: {children: React.ReactNode}) {
    useRoleGuard([Role.ADMIN, Role.SUPER_ADMIN, Role.LEADMANAGER])
    return (
        <section className="main__content">
            {children}
        </section>
    );
}