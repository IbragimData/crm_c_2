import { LeadStatus } from '../types';

export type LeadStatusUI = {
  label: string;
  text: string;
  bg: string;
};

export const LEAD_STATUS_UI: Record<LeadStatus, LeadStatusUI> = {
  [LeadStatus.NEW]: {
    label: 'New',
    text: '#fff',
    bg: '#00bfff',
  },
  [LeadStatus.ON_CALL]: {
    label: 'On call',
    text: '#fff',
    bg: '#cccc00',
  },
  [LeadStatus.IN_PROGRESS]: {
    label: 'In progress',
    text: '#fff',
    bg: '#3730A3',
  },
  [LeadStatus.CALL_BACK]: {
    label: 'Call back',
    text: '#fff',
    bg: '#cccc00',
  },
  [LeadStatus.REASSIGN]: {
    label: 'Reassigned',
    text: '#fff',
    bg: '#475569',
  },

  [LeadStatus.NO_ANSWER]: {
    label: 'No answer',
    text: '#fff',
    bg: '#595959',
  },

  [LeadStatus.LOW_POTENTIAL]: {
    label: 'Low potential',
    text: '#fff',
    bg: '#bb99ff',
  },
  [LeadStatus.HIGH_POTENTIAL]: {
    label: 'High potential',
    text: '#fff',
    bg: '#ad33ff',
  },

  [LeadStatus.DEPOSITED]: {
    label: 'Deposited',
    text: '#fff',
    bg: '#00cc00',
  },
  [LeadStatus.RE_DEPOSITED]: {
    label: 'Re-deposited',
    text: '#fff',
    bg: '#00cc00',
  },

  [LeadStatus.NOT_INTERESTED]: {
    label: 'Not interested',
    text: '#fff',
    bg: '#e67300',
  },
  [LeadStatus.NO_MONEY]: {
    label: 'No money',
    text: '#fff',
    bg: '#ff80d5',
  },

  [LeadStatus.JUNK]: {
    label: 'Junk',
    text: '#fff',
    bg: '#374151',
  },
  [LeadStatus.DUPLICATE]: {
    label: 'Duplicate',
    text: '#fff',
    bg: '#cc0000',
  },
  [LeadStatus.WRONG_NUMBER]: {
    label: 'Wrong number',
    text: '#fff',
    bg: '#ff5050',
  },
  [LeadStatus.WRONG_PERSON]: {
    label: 'Wrong person',
    text: '#fff',
    bg: '#ff5050',
  },
  [LeadStatus.WRONG_LANGUAGE]: {
    label: 'Wrong language',
    text: '#fff',
    bg: '#ff5050',
  },
};