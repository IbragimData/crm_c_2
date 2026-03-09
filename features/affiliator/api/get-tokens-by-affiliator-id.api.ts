import { axiosInstance } from "@/features/employees/api/axiosInsstance";
import { Token } from "../types";

/** GET /affiliator-token/affilator/:employeeId — список токенов по сотруднику (AFFILIATOR). */
export async function getTokensByAffiliatorId(employeeId: string): Promise<Token[]> {
  const { data } = await axiosInstance.get<Token[]>(`/affiliator-token/affilator/${employeeId}`);
  return data;
}