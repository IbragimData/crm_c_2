import { axiosInstance } from "@/features/employees/api/axiosInsstance";
import { Token } from "../types";

/** POST /affiliator-token — создать токен. Только ADMIN, SUPER_ADMIN. */
export async function createAffiliatorToken(employeeId: string): Promise<Token> {
  const { data } = await axiosInstance.post<Token>("/affiliator-token", { employeeId });
  return data;
}

/** PATCH /affiliator-token/:id/activate */
export async function activateAffiliatorToken(tokenId: string): Promise<Token> {
  const { data } = await axiosInstance.patch<Token>(`/affiliator-token/${tokenId}/activate`);
  return data;
}

/** PATCH /affiliator-token/:id/deactivate */
export async function deactivateAffiliatorToken(tokenId: string): Promise<Token> {
  const { data } = await axiosInstance.patch<Token>(`/affiliator-token/${tokenId}/deactivate`);
  return data;
}

/** DELETE /affiliator-token/:id */
export async function deleteAffiliatorToken(tokenId: string): Promise<Token> {
  const { data } = await axiosInstance.delete<Token>(`/affiliator-token/${tokenId}`);
  return data;
}

/** GET /affiliator-token/affilator/:employeeId — список токенов по сотруднику. */
export async function getAffiliatorTokensByEmployeeId(employeeId: string): Promise<Token[]> {
  const { data } = await axiosInstance.get<Token[]>(`/affiliator-token/affilator/${employeeId}`);
  return data;
}
