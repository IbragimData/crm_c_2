import { axiosInstance } from "./axiosInstance"; // путь под свой проект
import { Lead } from "../types";

export async function getLeadById(
    id: string
): Promise<Lead> {
    const { data } = await axiosInstance.get(`/leads/${id}`);

    return data;
}