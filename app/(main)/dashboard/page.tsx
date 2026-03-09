'use client'
import { LoginForm } from '@/features';
import s from "./dashboard.module.scss"
import { useAuthStore } from '@/features/auth/store/authStore';

export default function dashboroadPage() {
    const { employee } = useAuthStore()
    console.log(employee)
    return (
        <div className={s.DashboroadPage}>

        </div>
    );
}