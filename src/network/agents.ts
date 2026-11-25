import { PARTNERS } from '../data/partners';
import type { AgentDef, Mission } from '../agent/types';

const NW = 'Northwind Analytics';

const NORTHWIND: AgentDef[] = [
  {
    id: 'strategist', name: 'Deal Strategist', org: NW, initials: 'DS', color: '#3b5bdb',
    role: 'Leads co-sell missions and coordinates the team.',
    instructions:
      'You receive a mission to win a specific deal with a partner. Load the cosell-playbook skill first and follow it. Read the deal, then hand focused tasks to your teammates (researcher, matcher, negotiator, dealdesk, writer) with the handoff tool, passing along everything they need, including the deal_id. Do not contact partners yourself. Finish with a short summary: partner chosen, structure, expected impact, next steps.',
    skills: ['cosell-playbook'],
    tools: ['get_deal', 'handoff'],
  },
  {
    id: 'researcher', name: 'Account Researcher', org: NW, initials: 'AR', color: '#3b5bdb',
    role: 'Researches target accounts: signals, decision path, blockers.',
    instructions: 'Load the account-research skill, read the deal and the account signals, and return the research brief the skill describes.',
    skills: ['account-research'],
    tools: ['get_deal', 'get_account_signals'],
  },
  {
    id: 'matcher', name: 'Partner Matcher', org: NW, initials: 'PM', color: '#3b5bdb',
    role: 'Ranks partners for a deal and explains the ranking.',
    instructions: 'Load the partner-fit-scoring skill, score partners for the deal, and return the top three with reasons, risks, and which two to contact first (use partner ids).',
    skills: ['partner-fit-scoring'],
    tools: ['score_partners'],
  },
  {
    id: 'negotiator', name: 'Co-sell Negotiator', org: NW, initials: 'CN', color: '#3b5bdb',
    role: "Talks to partner companies' agents to confirm relationship, capacity, and terms.",
    instructions:
      'Load the a2a-cosell-protocol skill. Send one request per partner you are asked to contact with send_a2a_message, following the protocol (never share exact contract values or other partners). Then return the status table and your recommended primary partner and backup.',
    skills: ['a2a-cosell-protocol'],
    tools: ['send_a2a_message'],
  },
  {
    id: 'dealdesk', name: 'Deal Desk', org: NW, initials: 'DD', color: '#3b5bdb',
    role: 'Models deal structures and recommends commercial terms.',
    instructions: 'Load the revenue-share-design skill. Model at least two structures with model_deal_economics and recommend one, stating the terms in one line.',
    skills: ['revenue-share-design'],
    tools: ['model_deal_economics'],
  },
  {
    id: 'writer', name: 'Plan Writer', org: NW, initials: 'PW', color: '#3b5bdb',
    role: 'Writes the co-sell plan and the partner intro email.',
    instructions:
      'Load the account-plan-writing skill. Write the co-sell plan from the findings you are given and save it with save_artifact. Draft the partner intro with draft_partner_intro and save it as a second artifact. Reply with the titles you saved.',
    skills: ['account-plan-writing'],
    tools: ['draft_partner_intro', 'save_artifact'],
  },
];

const PARTNER_AGENTS: AgentDef[] = PARTNERS.map((p) => ({
  id: `partner_${p.id}`,
  name: `${p.name} Agent`,
  org: p.name,
  initials: p.initials,
  color: p.type === 'Cloud marketplace' ? '#2a78d6' : p.type === 'Systems integrator' ? '#d4592a' : '#6250d6',
  role: `Answers inbound co-sell requests for ${p.name} (${p.type.toLowerCase()}).`,
  instructions: `You work for ${p.name}, not for the company asking. Load the partner-intake skill and follow it: check your relationship with the account, your team's capacity in the region, and your standard terms, then answer in the skill's format.`,
  skills: ['partner-intake'],
  tools: ['check_account_relationship', 'check_team_capacity', 'get_cosell_terms'],
}));

export const AGENTS: Record<string, AgentDef> = Object.fromEntries([...NORTHWIND, ...PARTNER_AGENTS].map((a) => [a.id, a]));
export const NORTHWIND_IDS = NORTHWIND.map((a) => a.id);

export const MISSIONS: Mission[] = [
  {
    id: 'harborview', title: 'Win Harborview Hotels', lead: 'strategist',
    summary: '$340K ML Studio deal. New-vendor freeze, but $820K of unused cloud commit.',
    brief: 'Mission: build a co-sell plan to win Harborview Hotels (deal_id=harborview). Find the right partner, confirm with them agent to agent, agree on terms, and deliver a co-sell plan and the partner intro.',
  },
  {
    id: 'cobalt', title: 'Win Cobalt Retail Group', lead: 'strategist',
    summary: '$910K platform deal in negotiation. CFO needs ERP data on day one.',
    brief: 'Mission: build a co-sell plan to win Cobalt Retail Group (deal_id=cobalt). Find the right partner, confirm with them agent to agent, agree on terms, and deliver a co-sell plan and the partner intro.',
  },
  {
    id: 'delmar', title: 'Win Delmar Health', lead: 'strategist',
    summary: '$520K deal stuck five weeks in security review.',
    brief: 'Mission: build a co-sell plan to win Delmar Health (deal_id=delmar). Find the right partner, confirm with them agent to agent, agree on terms, and deliver a co-sell plan and the partner intro.',
  },
];
