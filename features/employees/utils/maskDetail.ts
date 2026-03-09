/**
 * If masking is enabled, return a masked string for display; otherwise return the original value.
 */
export function maskDetail(value: string | null | undefined, masked: boolean): string {
  if (masked && (value != null && value !== "")) return "••••••";
  return value ?? "—";
}
