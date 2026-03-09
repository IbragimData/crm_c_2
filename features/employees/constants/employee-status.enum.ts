export enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    ON_LEAVE = "ON_LEAVE",
    SICK = "SICK",
    FIRED = "FIRED",
}
export type EmployeeStatusUI = {
    label: string;
    text: string;
    bg: string;
};
// Mapping enum → display name
export const EMPLOYEE_STATUS_UI: Record<EmployeeStatus, EmployeeStatusUI> = {
    [EmployeeStatus.ACTIVE]: {
        label: "Active",
        text: "#16A34A",
        bg: "#16A34A52",
    },

    [EmployeeStatus.ON_LEAVE]: {
        label: "On Leave",
        text: "#D97706",
        bg: "#D9770652",
    },

    [EmployeeStatus.SICK]: {
        label: "Sick",
        text: "#2563EB",
        bg: "#2563EB52",
    },

    [EmployeeStatus.FIRED]: {
        label: "Fired",
        text: "#DC2626",
        bg: "#DC262652",
    },
};
export const roleLabels: Record<string, string> = {
    USER: "User",
    AFFILIATOR: "Affiliator",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
    LEADMANAGER: "Lead Manager",
    TEAMLEADER: "Team Leader",
    AGENT: "Agent",
};