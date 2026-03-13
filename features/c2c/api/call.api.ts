import { axiosInstance } from "../../lead/api/axiosInstance";
import { normalizePhoneToDigits } from "../utils/normalizePhone";

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
    const customerNumber = normalizePhoneToDigits(payload.customerNumber);
    const agentNumber = normalizePhoneToDigits(payload.agentNumber);
    const { data } = await axiosInstance.post<C2CResponse>(
        "/c2c",
        {
            customerNumber,
            agentNumber,
        }
    );
    return data;
};