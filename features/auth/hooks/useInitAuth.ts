"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export function useInitAuth() {
    const router = useRouter();
    const pathname = usePathname();

    const { setEmployee, setAuthChecked, logout } = useAuthStore();

    useEffect(() => {
        async function init() {
            const token = localStorage.getItem("token");

            // если нет токена → редирект на логин
            if (!token) {
                setAuthChecked(true);
                if (pathname !== "/login") {
                    router.replace("/login");
                }
                return;
            }

            try {
                const employee = await getMe();

                // если токен невалидный
                if (!employee) {
                    logout();
                    setAuthChecked(true);
                    router.replace("/login");
                    return;
                }

                // если все ок, сохраняем пользователя
                setEmployee(employee);
                setAuthChecked(true);

                // если авторизован и на логине → редирект на главную
                if (pathname === "/login") {
                    router.replace("/leads");
                }
            } catch (error) {
                // на случай ошибки запроса
                logout();
                setAuthChecked(true);
                router.replace("/login");
            }
        }

        init();
    }, [router, pathname, setEmployee, setAuthChecked, logout]);
}