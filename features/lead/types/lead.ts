
export enum LeadStatus {
    NEW = 'NEW',
    ON_CALL = 'ON_CALL',
    NO_ANSWER = 'NO_ANSWER',
    CALL_BACK = 'CALL_BACK',
    IN_PROGRESS = 'IN_PROGRESS',
    REASSIGN = 'REASSIGN',
    LOW_POTENTIAL = 'LOW_POTENTIAL',
    HIGH_POTENTIAL = 'HIGH_POTENTIAL',
    DEPOSITED = 'DEPOSITED',
    RE_DEPOSITED = 'RE_DEPOSITED',
    NOT_INTERESTED = 'NOT_INTERESTED',
    NO_MONEY = 'NO_MONEY',
    JUNK = 'JUNK',
    DUPLICATE = 'DUPLICATE',
    WRONG_NUMBER = 'WRONG_NUMBER',
    WRONG_PERSON = 'WRONG_PERSON',
    WRONG_LANGUAGE = 'WRONG_LANGUAGE',
}

export enum TeamRole {
    AGENT = 'AGENT',
    TEAMLEADER = 'TEAMLEADER',
    LEADMANAGER = 'LEADMANAGER',
}

export interface Lead {
    // SYSTEM FIELDS
    id: string;
    shortId?: string | null
    // BASIC INFO
    firstName: string;
    lastName: string;
    status: LeadStatus;

    // CONTACT INFO
    email: string;
    phone: string;

    createdAt: Date;
    updatedAt: Date;

    // EXTERNAL / INTEGRATION
    externalLeadId?: string | null;

    // OWNERSHIP & MANAGEMENT
    leadOwnerId?: string | null;
    createdBy?: string | null;
    modifiedBy?: string | null;
    connectedTo?: string | null;

    // DESCRIPTION
    description?: string | null;
    seedPhrases?: string | null

    // VISIT SUMMARY / ANALYTICS
    firstVisit?: Date | null;
    mostRecentVisit?: Date | null;
    firstPageVisited?: string | null;
    referrer?: string | null;
    averageTimeSpent?: number | null; // Prisma Decimal → number
    numberOfChats?: number | null;
    visitorScore?: bigint | null;
    daysVisited?: number | null;
    leadSource?: string | null;
    // RELATIONS
    leadAffiliates: LeadAffiliate[]
    leadAssignments?: LeadAssignment[];
}

export interface LeadAffiliate {
    id: string
    leadId: string
    affiliateId: string
    createdAt: Date
}

export interface Team {
    id: string;
    name: string;
    isActive: boolean;

    createdBy?: string | null;

    createdAt: Date;
    updatedAt: Date;

    // RELATIONS
    members?: TeamMember[];
    leadAssignments?: LeadAssignment[];
}
export interface LeadAssignment {
    id: string;

    leadId: string;
    teamId: string;

    createdBy?: string | null;
    assignedAt: Date;

    // RELATIONS
    lead?: Lead;
    team?: Team;
}

export interface TeamMember {
    id: string;

    teamId: string;
    employeeId: string;

    role: TeamRole;
    createdBy?: string | null;

    createdAt: Date;
    updatedAt: Date;

    // RELATIONS
    team?: Team;
}

export interface GetLeadsParams {
    skip?: number;
    take?: number;
    /** Один статус или массив — в API уходит как status=NEW&status=IN_PROGRESS или status=NEW,IN_PROGRESS */
    status?: LeadStatus | LeadStatus[];
    dateFrom?: string;
    dateTo?: string;
    leadOwnerId?: string;
}

export interface SearchLeadsParams {
    skip?: number;
    take?: number;
}



// features/lead/types.ts
export type LeadFilters = {
    status?: LeadStatus | LeadStatus[];
    dateFrom?: string;
    dateTo?: string;
    leadOwnerId?: string;
};
