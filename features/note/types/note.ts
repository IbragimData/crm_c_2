// ===============================
// Тип для заметки лида
// ===============================
export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetNoteParams {
  skip?: number;
  take?: number;
  dateFrom?: string;
  dateTo?: string;
}