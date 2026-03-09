import { axiosInstance } from "./axiosInstance";
import { Lead } from "../types";

export interface SearchLeadsByIdParams {
    skip?: number;
    take?: number;
    query?: string,
}

export async function searchLeads(
    params: SearchLeadsByIdParams = {}
): Promise<Lead[]> {
    const { data } = await axiosInstance.post("/leads/search",
        params
    );

    return data.items;
}