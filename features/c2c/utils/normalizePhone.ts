/**
 * Normalize phone number to digits only for API (e.g. +1(437)484-4838 → 14374844838).
 */
export function normalizePhoneToDigits(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}
