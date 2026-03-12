export type CallbackScheduleStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface CallbackScheduleLead {
  id: string;
  shortId: string | null;
  firstName: string;
  lastName: string;
  leadOwnerId: string | null;
  status: string;
}

export interface CallbackSchedule {
  id: string;
  leadId: string;
  scheduledAt: string;
  assignedTo: string;
  note: string | null;
  status: CallbackScheduleStatus;
  createdAt: string;
  updatedAt: string;
  lead: CallbackScheduleLead;
}

export interface CreateCallbackSchedulePayload {
  leadId: string;
  scheduledAt: string; // ISO
  assignedTo: string;
  note?: string;
}

export interface UpdateCallbackSchedulePayload {
  scheduledAt?: string;
  assignedTo?: string;
  note?: string;
  status?: CallbackScheduleStatus;
}

export interface ListSchedulesParams {
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  leadId?: string;
  skip?: number;
  take?: number;
}
