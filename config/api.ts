/** API base URLs. TIME_URL: set NEXT_PUBLIC_TIME_API_URL in .env for production (e.g. https://crm-call.pro/api/time). */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "https://crm-call.pro/api/",
  LEAD_URL: process.env.NEXT_PUBLIC_LEAD_URL ?? "https://crm-call.pro/api/lead",
  TIME_URL: process.env.NEXT_PUBLIC_TIME_API_URL ?? "https://crm-call.pro/api/time",
  C2C: process.env.NEXT_PUBLIC_C2C_URL ?? "https://apiv2.voiceflow.cc/c2c",
};