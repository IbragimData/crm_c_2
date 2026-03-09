import { Lead } from "../types";
import { LEAD_STATUS_UI } from "../constants/lead-status-color";

function escapeCsvCell(value: unknown): string {
  if (value == null || value === "") return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDate(d: Date | string): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return "";
  }
}

/**
 * Export leads to CSV string (Excel-compatible). Use for "Download as Excel" / CSV.
 */
export function exportLeadsToCsv(leads: Lead[]): string {
  const headers = [
    "ID",
    "Short ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Status",
    "Lead Owner ID",
    "Created At",
    "Updated At",
    "Description",
    "Lead Source",
    "Connected To",
  ];
  const rows = leads.map((lead) => [
    lead.id,
    lead.shortId ?? "",
    lead.firstName,
    lead.lastName,
    lead.email,
    lead.phone,
    LEAD_STATUS_UI[lead.status]?.label ?? lead.status,
    lead.leadOwnerId ?? "",
    formatDate(lead.createdAt),
    formatDate(lead.updatedAt),
    lead.description ?? "",
    lead.leadSource ?? "",
    lead.connectedTo ?? "",
  ]);
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Trigger download of CSV file in browser.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
