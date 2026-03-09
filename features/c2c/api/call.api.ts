import { axiosInstance } from "../../lead/api/axiosInstance";

export interface C2CPayload {
    agentNumber: string;
    customerNumber: string;
}

export interface C2CResponse {
    "request-id": string;
    "request-timestamp": string;
    "c2c-status": boolean;
    "internal-code": string;
    "request-data": any;
}

export const createC2CCall = async (
    payload: C2CPayload
): Promise<C2CResponse> => {
    console.log(payload)
    const { data } = await axiosInstance.post<C2CResponse>(
        "/c2c",
        {
            customerNumber: payload.customerNumber,
            agentNumber: payload.agentNumber,

        }
    );

    return data;
};