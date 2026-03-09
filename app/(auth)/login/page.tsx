import { LoginForm } from '@/features';
import s from './LoginPage.module.scss'

export default function LoginPage() {
    return (
        <div className={s.LoginPage}>
            <div className={s.LoginPage__contener}>
                <div className={s.LoginPage__content}>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}