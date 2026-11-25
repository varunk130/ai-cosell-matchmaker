/**
 * Partner matching: score every partner against a deal on six explainable
 * factors, rank them, and turn the strongest factors into plain-English reasons.
 *
 * The score is transparent on purpose. Sellers will not bring a partner into a
 * deal because a black box said so; they will if the reasons match what they
 * heard on the last call.
 */
import { BLOCKER_LABEL, PARTNERS, type Partner } from '../data/partners';
import type { Deal } from '../data/deals';

export type FactorKey = 'blocker' | 'relationship' | 'commit' | 'industry' | 'region' | 'trackRecord';

export const FACTORS: { key: FactorKey; label: string; weight: number; help: string }[] = [
  { key: 'blocker', label: 'Solves the blocker', weight: 0.32, help: 'The partner removes what is holding the deal up.' },
  { key: 'relationship', label: 'Already in the account', weight: 0.2, help: 'Active project or existing customer relationship.' },
  { key: 'commit', label: 'Cloud commit', weight: 0.14, help: 'Customer can pay from unused committed cloud spend.' },
  { key: 'industry', label: 'Industry expertise', weight: 0.14, help: 'Partner specializes in the customer industry.' },
  { key: 'region', label: 'Region coverage', weight: 0.08, help: 'Partner has a team in the customer region.' },
  { key: 'trackRecord', label: 'Co-sell track record', weight: 0.12, help: 'Historical win rate on co-sold deals.' },
];

export type Factors = Record<FactorKey, number>;

export interface Match {
  partner: Partner;
  /** 0..100 */
  score: number;
  factors: Factors;
  reasons: string[];
  risks: string[];
  /** Is this partner a strong enough fit to recommend at all? */
  recommended: boolean;
}

const money = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`);

export function factorsFor(deal: Deal, partner: Partner): Factors {
  const idx = deal.blockers.findIndex((b) => partner.solves.includes(b));
  // A marketplace only helps if the customer actually buys on that cloud.
  const wrongCloud = partner.type === 'Cloud marketplace' && deal.cloud !== partner.id;
  const blocker = idx === -1 || wrongCloud ? 0 : idx === 0 ? 1 : 0.6;

  const rel = deal.relationships[partner.id];
  const relationship = rel === 'active-project' ? 1 : rel === 'customer' ? 0.6 : 0;

  let commit = 0;
  if (partner.type === 'Cloud marketplace') {
    commit = deal.cloud === partner.id ? Math.min(1, deal.commitRemaining / deal.amount) : 0;
  }

  const industry = partner.industries === 'all' ? 0.5 : partner.industries.includes(deal.industry) ? 1 : 0;
  const region = partner.regions.includes(deal.region) ? 1 : 0;
  const trackRecord = Math.max(0, Math.min(1, (partner.winRate - 0.3) / 0.2));

  return { blocker, relationship, commit, industry, region, trackRecord };
}

export function scoreOf(f: Factors): number {
  return Math.round(FACTORS.reduce((s, { key, weight }) => s + weight * f[key], 0) * 100);
}

function reasonsFor(deal: Deal, p: Partner, f: Factors): string[] {
  const out: { weight: number; text: string }[] = [];
  const solved = deal.blockers.find((b) => p.solves.includes(b));
  if (solved && f.blocker > 0) {
    const lead = f.blocker === 1 ? 'Removes the main blocker' : 'Removes a secondary blocker';
    out.push({ weight: 0.32 * f.blocker, text: `${lead}: “${BLOCKER_LABEL[solved].toLowerCase()}.” ${p.pitch}` });
  }
  if (f.commit > 0) {
    const cover = deal.commitRemaining / deal.amount;
    out.push({
      weight: 0.14 * f.commit,
      text: `${deal.account} has ${money(deal.commitRemaining)} of unused ${p.name} commit${cover >= 1 ? `, enough to cover this ${money(deal.amount)} deal ${cover >= 2 ? `${Math.floor(cover)}x over` : 'in full'}` : `, covering ${Math.round(cover * 100)}% of this deal`}.`,
    });
  }
  const rel = deal.relationships[p.id];
  if (rel) {
    out.push({
      weight: 0.2 * f.relationship,
      text: rel === 'active-project'
        ? `${p.name} is running an active project at ${deal.account}, so they already have a trusted seat at the table.`
        : `${deal.account} is an existing ${p.name} customer.`,
    });
  }
  if (f.industry === 1) out.push({ weight: 0.14, text: `Specializes in ${deal.industry.toLowerCase()}.` });
  if (p.winRate >= 0.42) out.push({ weight: 0.12 * f.trackRecord, text: `Wins ${Math.round(p.winRate * 100)}% of the deals we co-sell together.` });
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3).map((r) => r.text);
}

function risksFor(deal: Deal, p: Partner, f: Factors): string[] {
  const out: string[] = [];
  if (p.load >= 0.75) out.push(`${p.name} is at ${Math.round(p.load * 100)}% capacity this quarter. Confirm they can staff it.`);
  if (p.responseDays >= 7 && (deal.stage === 'Proposal' || deal.stage === 'Negotiation'))
    out.push(`Typically takes ${p.responseDays} days to engage, which is slow for a deal in ${deal.stage.toLowerCase()}.`);
  if (f.region === 0) out.push(`No team in ${deal.region}.`);
  return out;
}

export function rankPartners(deal: Deal, partners: Partner[] = PARTNERS): Match[] {
  return partners
    .map((partner) => {
      const factors = factorsFor(deal, partner);
      const score = scoreOf(factors);
      return {
        partner,
        score,
        factors,
        reasons: reasonsFor(deal, partner, factors),
        risks: risksFor(deal, partner, factors),
        recommended: score >= 50 && factors.blocker > 0 && factors.region > 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.partner.name.localeCompare(b.partner.name));
}

export function bestMatch(deal: Deal): Match | null {
  const top = rankPartners(deal)[0];
  return top && top.recommended ? top : null;
}

export function introEmail(deal: Deal, m: Match): { subject: string; body: string } {
  const first = m.partner.manager.split(' ')[0];
  const ask =
    m.partner.type === 'Cloud marketplace'
      ? `Could we set up a private offer so ${deal.account} can purchase through ${m.partner.name} against their existing commit?`
      : m.partner.solves.includes(deal.blockers[0]) && deal.blockers[0] === 'security-review'
        ? `Would you be open to joining a call with their risk team to walk through your pre-approved controls?`
        : `Would you be open to a 30-minute joint call with their ${deal.champion.toLowerCase()} next week?`;
  return {
    subject: `Co-sell: ${deal.account} (${money(deal.amount)}, ${deal.stage})`,
    body: [
      `Hi ${first},`,
      ``,
      `We're working with ${deal.account} on a ${money(deal.amount)} ${deal.product} opportunity targeting ${new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. I think ${m.partner.name} can help us win it:`,
      ``,
      ...m.reasons.map((r) => `• ${r}`),
      ``,
      `From our last call: “${deal.note}”`,
      ``,
      ask,
      ``,
      `Thanks,`,
      deal.owner,
    ].join('\n'),
  };
}
