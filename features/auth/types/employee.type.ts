// ENUMS
export enum Role {
    USER = "USER",
    AFFILIATOR = "AFFILIATOR",
    AGENT = "AGENT",
    TEAMLEADER = "TEAMLEADER",
    LEADMANAGER = "LEADMANAGER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
}

export enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    ON_LEAVE = "ON_LEAVE",
    SICK = "SICK",
    FIRED = "FIRED",
}

// MODELS
export interface Employee {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    status: EmployeeStatus;

    // ПЕРСОНАЛЬНЫЕ ДАННЫЕ
    firstName: string;
    lastName: string;
    middleName?: string | null;
    phone?: string | null;
    phoneSecondary?: string | null;
    telegramUsername?: string | null;
    avatarUrl?: string | null;

    // РАБОЧАЯ ИНФОРМАЦИЯ
    department?: string | null;
    hiredAt: Date;
    firedAt?: Date | null;

    // ТЕХНИЧЕСКИЕ ПОЛЯ
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdById?: string | null;
    updatedById?: string | null;
    isDeleted: boolean;

    /** When true, sensitive fields (email, phone, telegram) are hidden/masked for other users. */
    detailsMasked?: boolean;

    // Связь
    affiliatorTokens?: AffiliatorToken[];
}

export interface AffiliatorToken {
    id: string;
    employeeId: string;
    token: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    revokedAt?: Date | null;

    // Связь
    employee?: Employee;
}