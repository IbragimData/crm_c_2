import { LeadStatus } from "../types";

/** CSV "Lead Owner" display name → employee ID(s). Use first ID when multiple. */
export const userMappingOwner: Record<string, string[]> = {
  "Bernard Lacroix": ["44296141-ce71-4722-b148-76e1a46a344e"],
  "Charlotte Vanbeuren Robb": ["760fe780-2c8c-4bb6-ae7c-8c9c09b15dd9"],
  "Edward Charles": ["fbb4b5cb-fd1a-4bc7-b50f-26dec6a9debf"],
  "Elina Martinez": ["c749797f-520e-4876-8682-d7632cadbf8f"],
  "Ella Parker": ["b7ca93f3-8393-4abb-a710-a5e694b05740"],
  "Isaac James": ["5ceb944c-c4eb-46c6-856d-4e7ba3042135"],
  "Jasmine Thibault": ["1b234ece-8578-4f0b-8f02-702eb40c84e4"],
  "Jemmy John": ["5ceb944c-c4eb-46c6-856d-4e7ba3042135"],
  "Julio Reyes": ["5ceb944c-c4eb-46c6-856d-4e7ba3042135"],
  "Luna Markus": ["2d205827-317f-4e36-81de-6c561834eb79"],
  "Maeva Dubois": ["0aafd60d-a509-4597-abbb-eab7a7226c6e"],
  "Martin Morales": ["a9f8f81e-b915-4dec-9188-b5a08e6b66e3"],
  "Michael Pierce": ["15f7f013-20d0-4de7-9c95-ed9183867e77"],
  "Owen Williams": ["949a4ca0-af3f-48b8-985f-79d80dbf0e1d"],
  "Sean Adams": ["96337a70-e4dd-4c82-8a54-a3109e86edb0"],
  "Valentine Wespier": ["5ceb944c-c4eb-46c6-856d-4e7ba3042135"],
  "Yann Gehan": ["a2d7838d-3890-41cc-809c-8f4307aa1302"],
};

/** Default lead owner ID when CSV "Lead Owner" is empty. */
export const DEFAULT_LEAD_OWNER_ID = "15f7f013-20d0-4de7-9c95-ed9183867e77";

/** CSV "Lead Status" string (lowercase, trimmed) → LeadStatus enum. */
export const csvLeadStatusToEnum: Record<string, LeadStatus> = {
  new: LeadStatus.NEW,
  "on call": LeadStatus.ON_CALL,
  "no answer": LeadStatus.NO_ANSWER,
  "call back": LeadStatus.CALL_BACK,
  "in progress": LeadStatus.IN_PROGRESS,
  reassign: LeadStatus.REASSIGN,
  "low potential": LeadStatus.LOW_POTENTIAL,
  "high potential": LeadStatus.HIGH_POTENTIAL,
  deposited: LeadStatus.DEPOSITED,
  "re-deposited": LeadStatus.RE_DEPOSITED,
  re_deposited: LeadStatus.RE_DEPOSITED,
  "not interested": LeadStatus.NOT_INTERESTED,
  "no money": LeadStatus.NO_MONEY,
  junk: LeadStatus.JUNK,
  duplicate: LeadStatus.DUPLICATE,
  "wrong number": LeadStatus.WRONG_NUMBER,
  "wrong person": LeadStatus.WRONG_PERSON,
  "wrong language": LeadStatus.WRONG_LANGUAGE,
};

/**
 * CSV "Tag" (affiliator name) → affiliateId.
 * Use "Delete" or null to skip that tag (no affiliate link).
 */
export const tagToAffiliateId: Record<string, string | null> = {
  "AU sentinel": null, // "Delete" = do not link
  BACA: "3dbea15e-4d06-4a56-8b7b-9af75764bf8e",
  "Coin Shield": "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  EN: "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  FR: "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  "International-Legal-Assis": "2b93817f-b332-44a5-99a5-bfa088f789e4",
  LP: "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  Lexora: "2b93817f-b332-44a5-99a5-bfa088f789e4",
  SIP: "29db2d28-360e-4bfe-b6fa-d80a5f30eed3",
  backmycapital: "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  "france fr": "c8176079-d4e5-4aa1-af68-27e59eabe3ab",
  newfr: "beebe024-fe8c-4b31-903b-8906c09e35ec",
  "safe-funds": "84ff5226-413c-493d-9fd4-96cadbb03ab2",
  voso: "471ce1fb-91d4-4423-91f1-61d9a6fa45ab",
};
