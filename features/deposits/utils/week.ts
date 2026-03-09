/** Today in YYYY-MM-DD format (for deposit date) */
export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
