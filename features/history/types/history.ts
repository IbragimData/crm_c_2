// ===============================
// Enum действий в истории лида
// ===============================
export enum LeadHistoryAction {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  OWNER_CHANGED = 'OWNER_CHANGED',
  FIELD_UPDATED = 'FIELD_UPDATED',
  NOTE_ADDED = 'NOTE_ADDED',
  NOTE_UPDATED = 'NOTE_UPDATED',
  NOTE_DELETED = 'NOTE_DELETED',
  SYSTEM = 'SYSTEM',
  TEAM_ASSIGNED = 'TEAM_ASSIGNED',
  TEAM_REMOVED = 'TEAM_REMOVED',
  REMINDER_CREATED = 'REMINDER_CREATED',
  REMINDER_COMPLETED = 'REMINDER_COMPLETED',
}


// ===============================
// Тип для записи истории лида
// ===============================
export interface LeadHistory {
  id: string;
  leadId: string;
  action: LeadHistoryAction;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  createdAt: Date;
}

export interface GetHistoryParams {
  skip?: number;
  take?: number;
  dateFrom?: string;
  dateTo?: string;
}