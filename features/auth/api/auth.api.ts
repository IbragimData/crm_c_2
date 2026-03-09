import { axiosInstance } from "./axiosInstance";

interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

export async function login(email: string, password: string) {
    const { data } = await axiosInstance.post<LoginResponse>(
        "/auth/login",
        { email, password }
    );

    return data;
}