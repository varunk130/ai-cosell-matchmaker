/**
 * Synthetic partner ecosystem for Northwind Analytics, a fictional B2B data
 * platform. Every company and person here is made up.
 */

export type PartnerType = 'Cloud marketplace' | 'Systems integrator' | 'Software partner';
export type Region = 'North America' | 'EMEA' | 'APAC' | 'LATAM';
export type Industry =
  | 'Financial services'
  | 'Insurance'
  | 'Retail'
  | 'Manufacturing'
  | 'Healthcare'
  | 'Public sector'
  | 'Hospitality'
  | 'Energy'
  | 'Telecom'
  | 'Media'
  | 'Education';

/** What is standing between the deal and a signature. Partners solve different blockers. */
export type Blocker = 'marketplace-procurement' | 'migration-capacity' | 'security-review' | 'crm-integration' | 'erp-integration' | 'exec-access';

export const BLOCKER_LABEL: Record<Blocker, string> = {
  'marketplace-procurement': 'Wants to buy through a cloud marketplace',
  'migration-capacity': 'No in-house team to migrate legacy data',
  'security-review': 'Stuck in security and compliance review',
  'crm-integration': 'Needs the platform wired into their CRM',
  'erp-integration': 'Needs finance data from their ERP',
  'exec-access': 'No access to an executive sponsor',
};

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  initials: string;
  manager: string;
  managerEmail: string;
  solves: Blocker[];
  industries: Industry[] | 'all';
  regions: Region[];
  /** Historical win rate on co-sold deals. */
  winRate: number;
  /** Median days from intro to the partner's first meeting with the customer. */
  responseDays: number;
  /** Share of partner team capacity already committed this quarter. */
  load: number;
  /** One line a seller would use to describe them. */
  pitch: string;
}

export const PARTNERS: Partner[] = [
  {
    id: 'stratus', name: 'Stratus Cloud', type: 'Cloud marketplace', initials: 'SC', manager: 'Dana Okafor', managerEmail: 'dana.okafor@stratus.example',
    solves: ['marketplace-procurement'], industries: 'all', regions: ['North America', 'EMEA', 'APAC', 'LATAM'],
    winRate: 0.44, responseDays: 3, load: 0.55, pitch: 'Customers can buy on their existing cloud bill and burn down committed spend.',
  },
  {
    id: 'nimbus', name: 'Nimbus Cloud', type: 'Cloud marketplace', initials: 'NC', manager: 'Leo Varga', managerEmail: 'leo.varga@nimbus.example',
    solves: ['marketplace-procurement'], industries: 'all', regions: ['North America', 'EMEA', 'APAC'],
    winRate: 0.39, responseDays: 5, load: 0.4, pitch: 'Private offers through the Nimbus marketplace, counted against cloud commits.',
  },
  {
    id: 'meridian', name: 'Meridian Consulting', type: 'Systems integrator', initials: 'MC', manager: 'Priya Raman', managerEmail: 'priya.raman@meridian.example',
    solves: ['migration-capacity', 'exec-access'], industries: ['Financial services', 'Insurance'], regions: ['North America', 'EMEA'],
    winRate: 0.47, responseDays: 6, load: 0.8, pitch: 'Runs data modernization programs for banks and insurers.',
  },
  {
    id: 'keystone', name: 'Keystone Digital', type: 'Systems integrator', initials: 'KD', manager: 'Marco Silva', managerEmail: 'marco.silva@keystone.example',
    solves: ['migration-capacity', 'erp-integration'], industries: ['Retail', 'Manufacturing', 'Hospitality', 'Energy'], regions: ['North America', 'LATAM'],
    winRate: 0.41, responseDays: 4, load: 0.5, pitch: 'Mid-market integrator for retail and industrial companies.',
  },
  {
    id: 'halden', name: 'Halden & Rowe', type: 'Systems integrator', initials: 'HR', manager: 'Sofia Lind', managerEmail: 'sofia.lind@haldenrowe.example',
    solves: ['migration-capacity', 'exec-access', 'security-review'], industries: ['Healthcare', 'Public sector', 'Education', 'Telecom'], regions: ['EMEA', 'APAC'],
    winRate: 0.38, responseDays: 9, load: 0.35, pitch: 'Advisory firm with C-level relationships in regulated industries.',
  },
  {
    id: 'pipewise', name: 'Pipewise CRM', type: 'Software partner', initials: 'PW', manager: 'Jordan Blake', managerEmail: 'jordan.blake@pipewise.example',
    solves: ['crm-integration'], industries: 'all', regions: ['North America', 'EMEA', 'APAC', 'LATAM'],
    winRate: 0.36, responseDays: 2, load: 0.3, pitch: 'Certified two-way integration with the leading mid-market CRM.',
  },
  {
    id: 'ledgerline', name: 'Ledgerline ERP', type: 'Software partner', initials: 'LL', manager: 'Amara Chen', managerEmail: 'amara.chen@ledgerline.example',
    solves: ['erp-integration'], industries: ['Manufacturing', 'Retail', 'Energy', 'Financial services'], regions: ['North America', 'EMEA'],
    winRate: 0.4, responseDays: 4, load: 0.45, pitch: 'Native connector for ERP finance and supply-chain data.',
  },
  {
    id: 'arcadia', name: 'Arcadia Security', type: 'Software partner', initials: 'AS', manager: 'Kenji Mori', managerEmail: 'kenji.mori@arcadia.example',
    solves: ['security-review'], industries: 'all', regions: ['North America', 'EMEA', 'APAC'],
    winRate: 0.42, responseDays: 3, load: 0.6, pitch: 'Pre-approved security controls that shortcut vendor risk reviews.',
  },
];

export const partnerById = (id: string): Partner => {
  const p = PARTNERS.find((x) => x.id === id);
  if (!p) throw new Error(`unknown partner ${id}`);
  return p;
};
