/**
 * API request/response examples (Teams & Leads).
 * Reference for development and debugging.
 * Base URL: https://crm-call.pro/api/lead — all paths relative to it.
 * Header: Authorization: Bearer <token>; for POST — Content-Type: application/json.
 *
 * LEAD & MEMBER ASSIGNMENT: ASSIGN_LEAD_TO_TEAM_SINGLE, BULK_ASSIGN_LEADS_TO_TEAM, ASSIGN_TEAMLEADER_TO_TEAM, ASSIGN_AGENT_TO_TEAM.
 * LEAD FILTERING: GET_LEADS (query: leadOwnerId, status — один или массив, dateFrom, dateTo), GET_LEADS_QUERY_PARAMS, GET_LEADS_FILTER_MULTIPLE_STATUSES;
 * для команды GET_TEAM_LEADS (query: leadOwnerId, leadOwnerInTeam, status), GET_TEAM_LEADS_QUERY_PARAMS, GET_TEAM_LEADS_FILTER_BY_LEAD_OWNER, GET_TEAM_LEADS_OWNER_IN_TEAM.
 * Запрос: заголовок Authorization: Bearer <token>, для POST — Content-Type: application/json; тело — см. request.body. Ответ — см. response.
 * СОЗДАНИЕ ЛИДА С АФФИЛИАТОРОМ: POST_LEADS_CREATE (body: affiliateIds), POST_LEADS_CREATE_WITH_AFFILIATE, POST_LEADS_CREATE_BODY.
 */

/**
 * Role capabilities (what each role can do).
 */
export const ROLE_CAPABILITIES = {
  AFFILIATOR: { leads: ["Create lead", "One lead by ID — own only", "Update lead", "Notes"], teams: [], other: [] },
  AGENT: { leads: ["Create lead", "List leads — owner only", "Search, one lead", "Update, bulk-status", "Notes"], teams: ["List teams — own only", "with-details", "Team leads"], other: ["GET /teams/:teamId/members"] },
  TEAMLEADER: { leads: ["Create lead", "List leads — by teams", "Search, one lead", "bulk-assign, bulk-status", "Notes"], teams: ["List teams — own", "with-details", "Members, team leads"], other: [] },
  LEADMANAGER: { leads: ["Create lead", "List leads — by teams", "bulk-assign, bulk-status", "Leads by affiliate/employee", "Notes"], teams: ["All teams", "with-details", "by employeeId", "Members, team leads"], other: ["LeadAssignment: create"] },
  ADMIN: { leads: ["Full lead access", "DELETE lead", "History, timeline"], teams: ["All teams", "POST/PUT teams", "Delete team — NO"], other: ["TeamMember, LeadAssignment: CRUD"] },
  SUPER_ADMIN: { leads: ["Same as ADMIN"], teams: ["Same as ADMIN + DELETE team"], other: ["Full access"] },
  USER: { leads: [], teams: [], other: [] },
} as const;

export const API_EXAMPLES = {
  // ==================== TEAMS ====================

  /** GET /teams — list teams */
  GET_TEAMS: {
    request: {
      method: "GET",
      path: "/teams",
      headers: { Authorization: "Bearer <access_token>" },
      query: {},
    },
    response: [
      {
        id: "uuid",
        name: "Sales Team A",
        isActive: true,
        createdBy: "uuid",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  },

  /** GET /teams/with-details — teams with members and leads */
  GET_TEAMS_WITH_DETAILS: {
    request: {
      method: "GET",
      path: "/teams/with-details",
      headers: { Authorization: "Bearer <access_token>" },
      query: {},
    },
    response: [
      {
        id: "team-uuid",
        name: "Sales Team A",
        isActive: true,
        createdBy: "uuid",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        members: [
          {
            id: "member-uuid",
            teamId: "team-uuid",
            employeeId: "user-uuid",
            role: "TEAMLEADER",
            createdBy: null,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        leadAssignments: [
          {
            id: "assignment-uuid",
            leadId: "lead-uuid",
            teamId: "team-uuid",
            createdBy: null,
            assignedAt: "2025-01-01T00:00:00.000Z",
            lead: {
              id: "lead-uuid",
              shortId: "LID12345",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "+1234567890",
              status: "NEW",
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z",
              leadOwnerId: "user-uuid",
              createdBy: null,
              description: null,
            },
          },
        ],
      },
    ],
  },

  /** GET /teams/employee/:employeeId — employee's teams */
  GET_TEAMS_BY_EMPLOYEE: {
    request: {
      method: "GET",
      path: "/teams/employee/15f7f013-20d0-4de7-9c95-ed9183867e77",
      headers: { Authorization: "Bearer <access_token>" },
      query: {},
    },
    response: [
      {
        id: "team-uuid",
        name: "Sales Team A",
        isActive: true,
        createdBy: "uuid",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  },

  /** GET /teams/:teamId/members — team members (paginated: items + total) */
  GET_TEAM_MEMBERS: {
    request: {
      method: "GET",
      path: "/teams/team-uuid/members",
      headers: { Authorization: "Bearer <access_token>" },
      query: { skip: 0, take: 20 },
    },
    response: {
      items: [
        {
          id: "member-uuid",
          teamId: "team-uuid",
          employeeId: "user-uuid",
          role: "AGENT",
          createdBy: null,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          team: { id: "team-uuid", name: "Sales Team A", isActive: true, createdBy: null, createdAt: "...", updatedAt: "..." },
        },
      ],
      total: 1,
    },
  },

  /** GET /teams/team/:teamId/leads — team leads with pagination and filters */
  GET_TEAM_LEADS: {
    description:
      "Лиды команды. Query: skip, take, status, leadOwnerId (UUID владельца), dateFrom, dateTo, leadOwnerInTeam (true = только лиды, чей владелец — участник команды).",
    request: {
      method: "GET",
      path: "/teams/team/team-uuid/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: {
        skip: 0,
        take: 20,
        status: "NEW",
        leadOwnerId: "15f7f013-20d0-4de7-9c95-ed9183867e77",
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-12-31T23:59:59.999Z",
        leadOwnerInTeam: true,
      },
    },
    response: {
      items: [
        {
          id: "lead-uuid",
          shortId: "LID12345",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          status: "NEW",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          leadOwnerId: "user-uuid",
          createdBy: null,
          description: null,
          leadSource: null,
          externalLeadId: null,
          modifiedBy: null,
          connectedTo: null,
          seedPhrases: null,
          firstVisit: null,
          mostRecentVisit: null,
          firstPageVisited: null,
          referrer: null,
          averageTimeSpent: null,
          numberOfChats: null,
          visitorScore: null,
          daysVisited: null,
        },
      ],
      total: 1,
    },
  },

  /** GET /teams/team/:teamId/leads?leadOwnerInTeam=true — только лиды, у которых владелец — участник этой команды */
  GET_TEAM_LEADS_OWNER_IN_TEAM: {
    description:
      "Фильтр leadOwnerInTeam=true: только лиды, у которых leadOwnerId = employeeId одного из участников команды.",
    request: {
      method: "GET",
      path: "/teams/team/team-uuid/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: { leadOwnerInTeam: true, skip: 0, take: 20 },
    },
    response: { items: [], total: 0 },
  },

  /** GET /teams/team/:teamId/leads?leadOwnerId=uuid — фильтр по владельцу лида (один сотрудник команды) */
  GET_TEAM_LEADS_FILTER_BY_LEAD_OWNER: {
    description:
      "Только лиды команды с указанным lead owner (UUID). Получить лидов одного сотрудника. Если передан и leadOwnerInTeam, приоритет у leadOwnerId.",
    request: {
      method: "GET",
      path: "/teams/team/team-uuid/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: { leadOwnerId: "15f7f013-20d0-4de7-9c95-ed9183867e77", skip: 0, take: 20 },
    },
    response: { items: [], total: 0 },
  },

  /** Справочник query-параметров GET /teams/team/:teamId/leads */
  GET_TEAM_LEADS_QUERY_PARAMS: {
    description: "Параметры в URL: GET /teams/team/:teamId/leads?skip=0&take=20&leadOwnerId=uuid",
    params: {
      skip: { type: "number", optional: true, default: 0, description: "Смещение для пагинации" },
      take: { type: "number", optional: true, default: 20, description: "Количество записей" },
      status: { type: "LeadStatus | LeadStatus[]", optional: true, description: "Один или несколько статусов (status=NEW&status=IN_PROGRESS или status=NEW,IN_PROGRESS)" },
      leadOwnerId: {
        type: "string (UUID)",
        optional: true,
        description: "Только лиды с указанным владельцем (leadOwnerId) — лиды одного сотрудника",
      },
      dateFrom: { type: "string (ISO 8601)", optional: true, description: "Начало периода по createdAt" },
      dateTo: { type: "string (ISO 8601)", optional: true, description: "Конец периода по createdAt" },
      leadOwnerInTeam: {
        type: "boolean",
        optional: true,
        description: "true = только лиды, у которых владелец — участник этой команды",
      },
    },
    exampleUrls: [
      "GET /teams/team/:teamId/leads",
      "GET /teams/team/:teamId/leads?leadOwnerId=15f7f013-20d0-4de7-9c95-ed9183867e77",
      "GET /teams/team/:teamId/leads?leadOwnerInTeam=true",
      "GET /teams/team/:teamId/leads?leadOwnerId=uuid&status=NEW&skip=0&take=20",
      "GET /teams/team/:teamId/leads?status=NEW&status=IN_PROGRESS",
    ],
  },

  /** POST /teams — create team (ADMIN, SUPER_ADMIN) */
  POST_TEAMS_CREATE: {
    request: {
      method: "POST",
      path: "/teams",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: { name: "Sales Team A", isActive: true },
    },
    response: {
      id: "new-team-uuid",
      name: "Sales Team A",
      isActive: true,
      createdBy: "current-user-uuid",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  },

  /** PUT /teams/:id — update team */
  PUT_TEAMS_UPDATE: {
    request: {
      method: "PUT",
      path: "/teams/team-uuid",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: { name: "Sales Team A (updated)", isActive: false },
    },
    response: {
      id: "team-uuid",
      name: "Sales Team A (updated)",
      isActive: false,
      createdBy: "uuid",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    },
  },

  /** DELETE /teams/:id — delete team (SUPER_ADMIN only) */
  DELETE_TEAMS: {
    request: {
      method: "DELETE",
      path: "/teams/team-uuid",
      headers: { Authorization: "Bearer <access_token>" },
      query: {},
    },
    response: { message: "Team deleted" },
  },

  // ==================== LEADS ====================

  /** GET /leads — list leads */
  GET_LEADS: {
    description: "Get all leads. Query params: skip (default 0), take (default 20), status (LeadStatus или массив), leadOwnerId (UUID), dateFrom (ISO 8601), dateTo (ISO 8601).",
    request: {
      method: "GET",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: {
        skip: 0,
        take: 20,
        status: "NEW",
        leadOwnerId: "15f7f013-20d0-4de7-9c95-ed9183867e77",
        dateFrom: "2025-01-01T00:00:00.000Z",
        dateTo: "2025-12-31T23:59:59.999Z",
      },
    },
    response: {
      items: [
        {
          id: "lead-uuid",
          shortId: "LID12345",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
          status: "NEW",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          leadOwnerId: "user-uuid",
          createdBy: null,
          description: null,
          leadAffiliates: [],
        },
      ],
      total: 1,
    },
  },

  /** Справочник query-параметров GET /leads */
  GET_LEADS_QUERY_PARAMS: {
    description: "Параметры в URL как query string. status — один или массив: status=NEW&status=IN_PROGRESS или status=NEW,IN_PROGRESS.",
    params: {
      skip: { type: "number", optional: true, default: 0, description: "Смещение для пагинации" },
      take: { type: "number", optional: true, default: 20, description: "Количество записей в ответе" },
      status: { type: "LeadStatus | LeadStatus[]", optional: true, description: "Один или несколько статусов. Варианты: status=NEW&status=IN_PROGRESS или status=NEW,IN_PROGRESS" },
      leadOwnerId: { type: "string (UUID)", optional: true, description: "Только лиды с указанным владельцем (leadOwnerId)" },
      dateFrom: { type: "string (ISO 8601)", optional: true, description: "Начало периода по createdAt" },
      dateTo: { type: "string (ISO 8601)", optional: true, description: "Конец периода по createdAt" },
    },
    exampleUrls: [
      "GET /leads",
      "GET /leads?skip=0&take=20",
      "GET /leads?leadOwnerId=15f7f013-20d0-4de7-9c95-ed9183867e77",
      "GET /leads?status=NEW&skip=0&take=10",
      "GET /leads?status=NEW&status=IN_PROGRESS",
      "GET /leads?status=NEW,IN_PROGRESS,DEPOSITED",
      "GET /leads?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-12-31T23:59:59.999Z",
      "GET /leads?leadOwnerId=uuid&status=IN_PROGRESS&skip=0&take=20",
    ],
  },

  /** GET /leads?leadOwnerId=uuid — фильтр по владельцу лида */
  GET_LEADS_FILTER_BY_LEAD_OWNER: {
    description: "Фильтрация по leadOwnerId. Query: leadOwnerId=uuid.",
    request: {
      method: "GET",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: { leadOwnerId: "15f7f013-20d0-4de7-9c95-ed9183867e77", skip: 0, take: 20 },
    },
    response: { items: [], total: 0 },
  },

  /** GET /leads?status=...&dateFrom=...&dateTo=... — фильтр по статусу и периоду */
  GET_LEADS_FILTER_STATUS_AND_DATES: {
    description: "status — один или несколько (NEW, IN_PROGRESS, ...); dateFrom/dateTo — ISO 8601, фильтр по createdAt.",
    request: {
      method: "GET",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: { status: ["IN_PROGRESS", "DEPOSITED"], dateFrom: "2025-01-01T00:00:00.000Z", dateTo: "2025-02-28T23:59:59.999Z", skip: 0, take: 10 },
    },
    response: { items: [], total: 0 },
  },

  /** GET /leads?status=NEW&status=IN_PROGRESS — фильтр по нескольким статусам */
  GET_LEADS_FILTER_MULTIPLE_STATUSES: {
    description: "Несколько статусов: status=NEW&status=IN_PROGRESS или status=NEW,IN_PROGRESS. Аналогично для GET /teams/team/:teamId/leads, GET /leads/affiliate/:id, GET /leads/employee/:id.",
    request: {
      method: "GET",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>" },
      query: { status: ["NEW", "IN_PROGRESS", "CALL_BACK"], skip: 0, take: 20 },
    },
    response: { items: [], total: 0 },
  },

  /** GET /leads/:id — single lead */
  GET_LEAD_ONE: {
    request: { method: "GET", path: "/leads/lead-uuid", headers: { Authorization: "Bearer <access_token>" }, query: {} },
    response: {
      id: "lead-uuid",
      shortId: "LID12345",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      status: "NEW",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      leadOwnerId: "user-uuid",
      createdBy: null,
      description: null,
      leadSource: null,
      externalLeadId: null,
      modifiedBy: null,
      connectedTo: null,
      seedPhrases: null,
      firstVisit: null,
      mostRecentVisit: null,
      firstPageVisited: null,
      referrer: null,
      averageTimeSpent: null,
      numberOfChats: null,
      visitorScore: null,
      daysVisited: null,
      leadAffiliates: [],
    },
  },

  /** POST /leads — create lead. Body: firstName, lastName, email, phone; optional: externalLeadId, leadSource, description, affiliateIds (array of UUIDs). */
  POST_LEADS_CREATE: {
    description: "Create lead. Optional body: externalLeadId, leadSource, description, affiliateIds (array of affiliate UUIDs).",
    request: {
      method: "POST",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        externalLeadId: "crm_123",
        leadSource: "Website",
        description: "Interested in demo",
      },
    },
    response: {
      id: "new-lead-uuid",
      shortId: "LID98765",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      status: "NEW",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      externalLeadId: "crm_123",
      leadSource: "Website",
      leadOwnerId: null,
      createdBy: "current-user-uuid",
      modifiedBy: null,
      connectedTo: null,
      description: "Interested in demo",
      seedPhrases: null,
      firstVisit: null,
      mostRecentVisit: null,
      firstPageVisited: null,
      referrer: null,
      averageTimeSpent: null,
      numberOfChats: null,
      visitorScore: null,
      daysVisited: null,
    },
  },

  /** POST /leads — create lead with affiliate (affiliateIds). */
  POST_LEADS_CREATE_WITH_AFFILIATE: {
    description: "Create lead with affiliate link. Body: affiliateIds — array of UUIDs; LeadAffiliate is created for each.",
    request: {
      method: "POST",
      path: "/leads",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        phone: "+996700654321",
        description: "Lead from affiliate LP",
        affiliateIds: ["84ff5226-413c-493d-9fd4-96cadbb03ab2"],
      },
    },
    response: {
      id: "new-lead-uuid",
      shortId: "LID12340",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "+996700654321",
      status: "NEW",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      leadOwnerId: null,
      createdBy: "current-user-uuid",
      description: "Lead from affiliate LP",
      leadAffiliates: [
        {
          id: "la-uuid",
          leadId: "new-lead-uuid",
          affiliateId: "84ff5226-413c-493d-9fd4-96cadbb03ab2",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
  },

  /** Reference: POST /leads body params; affiliateIds optional (array of UUIDs). */
  POST_LEADS_CREATE_BODY: {
    description: "affiliateIds (optional) — array of UUIDs; LeadAffiliate created for each. Duplicates are skipped.",
    bodyParams: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      email: { type: "string", required: true },
      phone: { type: "string", required: true },
      externalLeadId: { type: "string", optional: true },
      leadSource: { type: "string", optional: true },
      description: { type: "string", optional: true },
      affiliateIds: { type: "string[] (UUID)", optional: true },
    },
    exampleBodies: [
      { firstName: "John", lastName: "Doe", email: "j@mail.com", phone: "+996700111111" },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@mail.com",
        phone: "+996700222222",
        affiliateIds: ["84ff5226-413c-493d-9fd4-96cadbb03ab2"],
      },
    ],
  },

  /** POST /leads/search — search leads by ID or shortId */
  POST_LEADS_SEARCH: {
    request: {
      method: "POST",
      path: "/leads/search",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: { query: "LID12345", skip: 0, take: 20 },
    },
    response: { items: [], total: 0 },
  },

  // ==================== Lead & member assignment ====================

  /** Assign one lead to a team. Previous assignments for this lead are removed automatically. */
  ASSIGN_LEAD_TO_TEAM_SINGLE: {
    description: "Assign one lead to a team. Previous assignments for this lead are removed automatically.",
    request: {
      method: "POST",
      path: "/lead-assignments",
      headers: { Authorization: "Bearer <token>", "Content-Type": "application/json" },
      body: { leadId: "lead-uuid", teamId: "team-uuid" },
    },
    response: {
      id: "new-id",
      leadId: "lead-uuid",
      teamId: "team-uuid",
      createdBy: "user-uuid",
      assignedAt: "2026-02-28T12:00:00.000Z",
    },
  },

  /** Assign many leads to one team. Removed from previous teams, added to the new one. */
  BULK_ASSIGN_LEADS_TO_TEAM: {
    description: "Assign many leads to one team. Removed from previous teams, added to the new one.",
    request: {
      method: "POST",
      path: "/lead-assignments/bulk",
      headers: { Authorization: "Bearer <token>", "Content-Type": "application/json" },
      body: { teamId: "team-uuid", leadIds: ["lead-1", "lead-2"] },
    },
    response: {
      assigned: [
        { id: "a1", leadId: "lead-1", teamId: "team-uuid", createdBy: "user-uuid", assignedAt: "2026-02-28T12:00:00.000Z" },
        { id: "a2", leadId: "lead-2", teamId: "team-uuid", createdBy: "user-uuid", assignedAt: "2026-02-28T12:00:00.000Z" },
      ],
      removedCount: 1,
    },
  },

  /** Assign team lead to team. POST /team-members, role: TEAMLEADER. */
  ASSIGN_TEAMLEADER_TO_TEAM: {
    description: "Assign team lead to team. POST /team-members, role: TEAMLEADER.",
    request: {
      method: "POST",
      path: "/team-members",
      headers: { Authorization: "Bearer <token>", "Content-Type": "application/json" },
      body: { teamId: "team-uuid", employeeId: "employee-uuid", role: "TEAMLEADER" },
    },
    response: {
      id: "member-uuid",
      teamId: "team-uuid",
      employeeId: "employee-uuid",
      role: "TEAMLEADER",
      createdBy: "user-uuid",
      createdAt: "2026-02-28T12:00:00.000Z",
      updatedAt: "2026-02-28T12:00:00.000Z",
    },
  },

  /** Assign agent to team. POST /team-members, role: AGENT. */
  ASSIGN_AGENT_TO_TEAM: {
    description: "Assign agent to team. POST /team-members, role: AGENT.",
    request: {
      method: "POST",
      path: "/team-members",
      headers: { Authorization: "Bearer <token>", "Content-Type": "application/json" },
      body: { teamId: "team-uuid", employeeId: "employee-uuid", role: "AGENT" },
    },
    response: {
      id: "member-uuid",
      teamId: "team-uuid",
      employeeId: "employee-uuid",
      role: "AGENT",
      createdBy: "user-uuid",
      createdAt: "2026-02-28T12:00:00.000Z",
      updatedAt: "2026-02-28T12:00:00.000Z",
    },
  },
} as const;

/**
 * Примеры запросов и ответов API (Управление сотрудниками: пароли, роли, создание).
 * Доступ: заголовок Authorization: Bearer <token>. Для POST/PATCH — Content-Type: application/json.
 *
 * ПРАВА:
 * - SUPER_ADMIN: может менять пароль и роль любому; может создавать сотрудников с любой ролью.
 * - ADMIN: может менять пароль только у AGENT, TEAMLEADER, LEADMANAGER; может менять роль только у
 *   пользователей с ролью USER/AGENT/TEAMLEADER/LEADMANAGER и назначать только эти роли;
 *   не может менять пароль/роль у ADMIN и SUPER_ADMIN; может создавать сотрудников только с ролью
 *   USER, AGENT, TEAMLEADER или LEADMANAGER.
 */
export const API_EXAMPLES_EMPLOYEES_ADMIN = {
  PATCH_EMPLOYEE_PASSWORD: {
    description:
      "Смена пароля сотрудника. SUPER_ADMIN — у любого; ADMIN — только у AGENT, TEAMLEADER, LEADMANAGER.",
    request: {
      method: "PATCH",
      path: "/employees/:id/password",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: { newPassword: "NewSecurePass123!" },
    },
  },
  PATCH_EMPLOYEE_ROLE: {
    description:
      "Смена роли. SUPER_ADMIN — любую; ADMIN — только USER/AGENT/TEAMLEADER/LEADMANAGER и только у не-админов.",
    request: {
      method: "PATCH",
      path: "/employees/:id/role",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: { role: "TEAMLEADER" },
    },
  },
  POST_EMPLOYEES_CREATE: {
    description:
      "Создание сотрудника. SUPER_ADMIN — любая роль; ADMIN — только USER, AGENT, TEAMLEADER, LEADMANAGER.",
    request: {
      method: "POST",
      path: "/employees",
      headers: { Authorization: "Bearer <access_token>", "Content-Type": "application/json" },
      body: {
        email: "new.agent@company.com",
        password: "SecurePass123!",
        firstName: "Alex",
        lastName: "Smith",
        role: "AGENT",
        status: "ACTIVE",
        hiredAt: "2025-03-01",
        middleName: null,
        phone: null,
        telegramUsername: null,
        department: "Sales",
      },
    },
  },
} as const;
