import { axiosInstance } from "@/features/lead/api/axiosInstance";
import type {
  CallbackSchedule,
  CreateCallbackSchedulePayload,
  UpdateCallbackSchedulePayload,
  ListSchedulesParams,
} from "../types/schedule.types";

export async function getSchedules(
  params: ListSchedulesParams = {}
): Promise<{ items: CallbackSchedule[]; total: number }> {
  const { data } = await axiosInstance.get<{
    items: CallbackSchedule[];
    total: number;
  }>("/schedules", { params });
  return data;
}

export async function createSchedule(
  payload: CreateCallbackSchedulePayload
): Promise<CallbackSchedule> {
  const { data } = await axiosInstance.post<CallbackSchedule>(
    "/schedules",
    payload
  );
  return data;
}

export async function updateSchedule(
  id: string,
  payload: UpdateCallbackSchedulePayload
): Promise<CallbackSchedule> {
  const { data } = await axiosInstance.patch<CallbackSchedule>(
    `/schedules/${id}`,
    payload
  );
  return data;
}

export async function deleteSchedule(id: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(
    `/schedules/${id}`
  );
  return data;
}

export async function getDueSchedules(): Promise<CallbackSchedule[]> {
  const { data } = await axiosInstance.get<CallbackSchedule[]>(
    "/schedules/due"
  );
  return Array.isArray(data) ? data : [];
}
