import type { Blocker, Industry, Region } from './partners';

export type Stage = 'Discovery' | 'Evaluation' | 'Proposal' | 'Negotiation';
export const STAGES: Stage[] = ['Discovery', 'Evaluation', 'Proposal', 'Negotiation'];

export type Relationship = 'active-project' | 'customer';

export interface Deal {
  id: string;
  account: string;
  industry: Industry;
  region: Region;
  employees: number;
  amount: number;
  stage: Stage;
  closeDate: string;
  owner: string;
  product: 'Platform' | 'Platform + Governance' | 'ML Studio';
  /** Ordered: the first blocker is the one holding the deal up most. */
  blockers: Blocker[];
  cloud: 'stratus' | 'nimbus' | null;
  /** Unused committed spend on the customer's cloud contract, in dollars. */
  commitRemaining: number;
  /** Partners already inside the account. */
  relationships: Partial<Record<string, Relationship>>;
  /** From the last call, in the seller's words. */
  note: string;
  champion: string;
}

export const DEALS: Deal[] = [
  {
    id: 'avalon', account: 'Avalon Bank', industry: 'Financial services', region: 'North America', employees: 12000, amount: 640000,
    stage: 'Proposal', closeDate: '2027-01-30', owner: 'Rachel Kim', product: 'Platform + Governance',
    blockers: ['marketplace-procurement', 'migration-capacity'], cloud: 'stratus', commitRemaining: 2_100_000,
    relationships: { meridian: 'active-project' },
    note: 'Procurement asked if we are on the Stratus marketplace. They have commit to burn before fiscal year end.', champion: 'Head of Data Platform',
  },
  {
    id: 'brightline', account: 'Brightline Insurance', industry: 'Insurance', region: 'EMEA', employees: 5400, amount: 380000,
    stage: 'Evaluation', closeDate: '2027-02-27', owner: 'Tomás Ruiz', product: 'Platform',
    blockers: ['migration-capacity', 'exec-access'], cloud: 'nimbus', commitRemaining: 250_000,
    relationships: { meridian: 'customer' },
    note: 'Love the product, but their data team is 4 people and the claims warehouse is 15 years old.', champion: 'Director of Analytics',
  },
  {
    id: 'cobalt', account: 'Cobalt Retail Group', industry: 'Retail', region: 'North America', employees: 22000, amount: 910000,
    stage: 'Negotiation', closeDate: '2026-12-19', owner: 'Rachel Kim', product: 'Platform + Governance',
    blockers: ['erp-integration', 'marketplace-procurement'], cloud: 'nimbus', commitRemaining: 1_400_000,
    relationships: { keystone: 'active-project', ledgerline: 'customer' },
    note: 'CFO will only sign if inventory and margin data from Ledgerline flows in on day one.', champion: 'VP Merchandising Analytics',
  },
  {
    id: 'delmar', account: 'Delmar Health', industry: 'Healthcare', region: 'EMEA', employees: 8700, amount: 520000,
    stage: 'Evaluation', closeDate: '2027-03-15', owner: 'Aisha Bello', product: 'Platform + Governance',
    blockers: ['security-review', 'exec-access'], cloud: 'stratus', commitRemaining: 300_000,
    relationships: { halden: 'active-project' },
    note: 'Security questionnaire has been sitting with their risk team for five weeks.', champion: 'Chief Data Officer',
  },
  {
    id: 'everstone', account: 'Everstone Manufacturing', industry: 'Manufacturing', region: 'North America', employees: 6300, amount: 290000,
    stage: 'Discovery', closeDate: '2027-04-10', owner: 'Tomás Ruiz', product: 'Platform',
    blockers: ['erp-integration', 'migration-capacity'], cloud: null, commitRemaining: 0,
    relationships: { ledgerline: 'customer' },
    note: 'Plant data lives in Ledgerline and spreadsheets. No cloud contract yet.', champion: 'Director of Operations',
  },
  {
    id: 'fairway', account: 'Fairway Logistics', industry: 'Retail', region: 'LATAM', employees: 3100, amount: 180000,
    stage: 'Proposal', closeDate: '2027-01-22', owner: 'Aisha Bello', product: 'Platform',
    blockers: ['crm-integration'], cloud: 'stratus', commitRemaining: 90_000,
    relationships: { pipewise: 'customer' },
    note: 'Sales ops wants account health scores inside Pipewise, not another dashboard.', champion: 'Head of Revenue Operations',
  },
  {
    id: 'granite', account: 'Granite Public Schools', industry: 'Education', region: 'APAC', employees: 4200, amount: 150000,
    stage: 'Evaluation', closeDate: '2027-03-31', owner: 'Mei Tanaka', product: 'Platform',
    blockers: ['exec-access', 'security-review'], cloud: 'nimbus', commitRemaining: 40_000,
    relationships: {},
    note: 'IT likes us, but budget sits with the superintendent office and we have never met them.', champion: 'IT Director',
  },
  {
    id: 'harborview', account: 'Harborview Hotels', industry: 'Hospitality', region: 'North America', employees: 9800, amount: 340000,
    stage: 'Proposal', closeDate: '2027-02-12', owner: 'Rachel Kim', product: 'ML Studio',
    blockers: ['marketplace-procurement'], cloud: 'stratus', commitRemaining: 820_000,
    relationships: { keystone: 'customer' },
    note: 'New vendor onboarding takes 90 days. Buying on the Stratus bill skips it.', champion: 'VP Revenue Management',
  },
  {
    id: 'ironwood', account: 'Ironwood Energy', industry: 'Energy', region: 'North America', employees: 7600, amount: 470000,
    stage: 'Evaluation', closeDate: '2027-03-05', owner: 'Tomás Ruiz', product: 'ML Studio',
    blockers: ['migration-capacity', 'erp-integration'], cloud: 'nimbus', commitRemaining: 600_000,
    relationships: { keystone: 'active-project' },
    note: 'Sensor data migration is the long pole. Keystone is already on site for their ERP upgrade.', champion: 'Head of Asset Analytics',
  },
  {
    id: 'juniper', account: 'Juniper Telecom', industry: 'Telecom', region: 'EMEA', employees: 15000, amount: 720000,
    stage: 'Discovery', closeDate: '2027-05-20', owner: 'Aisha Bello', product: 'Platform + Governance',
    blockers: ['exec-access', 'migration-capacity'], cloud: 'stratus', commitRemaining: 1_100_000,
    relationships: { halden: 'customer' },
    note: 'Strategy office is running a data transformation review. We are not on the shortlist yet.', champion: 'Enterprise Architect',
  },
  {
    id: 'kestrel', account: 'Kestrel Airlines', industry: 'Hospitality', region: 'APAC', employees: 11000, amount: 560000,
    stage: 'Proposal', closeDate: '2027-01-29', owner: 'Mei Tanaka', product: 'ML Studio',
    blockers: ['security-review', 'marketplace-procurement'], cloud: 'stratus', commitRemaining: 450_000,
    relationships: { arcadia: 'customer' },
    note: 'Vendor risk wants SOC 2 plus regional data residency proof before legal will open the contract.', champion: 'Director of Loyalty Data',
  },
  {
    id: 'lakeshore', account: 'Lakeshore Foods', industry: 'Manufacturing', region: 'LATAM', employees: 2600, amount: 140000,
    stage: 'Negotiation', closeDate: '2026-12-12', owner: 'Tomás Ruiz', product: 'Platform',
    blockers: ['crm-integration'], cloud: null, commitRemaining: 0,
    relationships: { pipewise: 'customer', keystone: 'customer' },
    note: 'Last open item: distributor accounts must sync to Pipewise.', champion: 'Commercial Director',
  },
  {
    id: 'mosaic', account: 'Mosaic Media', industry: 'Media', region: 'North America', employees: 1900, amount: 120000,
    stage: 'Evaluation', closeDate: '2027-02-20', owner: 'Rachel Kim', product: 'ML Studio',
    blockers: ['marketplace-procurement'], cloud: 'nimbus', commitRemaining: 380_000,
    relationships: {},
    note: 'Finance froze new vendor contracts this quarter, but cloud spend is pre-approved.', champion: 'Head of Audience Data',
  },
  {
    id: 'northgate', account: 'Northgate University', industry: 'Education', region: 'EMEA', employees: 6800, amount: 230000,
    stage: 'Proposal', closeDate: '2027-02-06', owner: 'Aisha Bello', product: 'Platform + Governance',
    blockers: ['security-review', 'migration-capacity'], cloud: 'nimbus', commitRemaining: 120_000,
    relationships: { halden: 'active-project' },
    note: 'Student data rules mean the data protection officer must approve every new processor.', champion: 'Director of Institutional Research',
  },
  {
    id: 'orion', account: 'Orion Pharma', industry: 'Healthcare', region: 'North America', employees: 14000, amount: 830000,
    stage: 'Discovery', closeDate: '2027-06-15', owner: 'Rachel Kim', product: 'Platform + Governance',
    blockers: ['security-review', 'marketplace-procurement'], cloud: 'stratus', commitRemaining: 3_000_000,
    relationships: { arcadia: 'customer' },
    note: 'Validated-systems team is cautious. Large Stratus commit that the CIO wants to use.', champion: 'VP Research Informatics',
  },
  {
    id: 'pinecrest', account: 'Pinecrest Credit Union', industry: 'Financial services', region: 'North America', employees: 1400, amount: 110000,
    stage: 'Evaluation', closeDate: '2027-03-01', owner: 'Mei Tanaka', product: 'Platform',
    blockers: ['crm-integration', 'migration-capacity'], cloud: null, commitRemaining: 0,
    relationships: { pipewise: 'customer' },
    note: 'Member data is in Pipewise and a core banking system. Small IT team.', champion: 'Chief Operating Officer',
  },
];

export const dealById = (id: string): Deal | undefined => DEALS.find((d) => d.id === id);
