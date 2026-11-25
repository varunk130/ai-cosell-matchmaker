/**
 * Six quarters of synthetic closed deals, used to measure what partner
 * matching is worth. Seeded, so the numbers are stable across reloads.
 */
import { PARTNERS } from '../data/partners';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Engagement = 'none' | 'low-fit' | 'high-fit';

export interface ClosedDeal {
  quarter: string;
  amount: number;
  engagement: Engagement;
  partnerId: string | null;
  won: boolean;
  cycleDays: number;
}

export const QUARTERS = ['Q3 FY25', 'Q4 FY25', 'Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'];

/** Win probability and sales-cycle length by how well the engaged partner fit the deal. */
export const MODEL: Record<Engagement, { win: number; days: number }> = {
  none: { win: 0.21, days: 118 },
  'low-fit': { win: 0.25, days: 112 },
  'high-fit': { win: 0.41, days: 86 },
};

export function generateHistory(seed = 42, perQuarter = 150): ClosedDeal[] {
  const rand = mulberry32(seed);
  const out: ClosedDeal[] = [];
  QUARTERS.forEach((quarter, qi) => {
    // Partner engagement grows over time as the co-sell motion matures.
    const engagedShare = 0.16 + qi * 0.045;
    const highFitShare = 0.35 + qi * 0.08;
    for (let i = 0; i < perQuarter; i++) {
      const amount = Math.round((80_000 + rand() ** 2 * 900_000) / 1000) * 1000;
      const engagement: Engagement = rand() < engagedShare ? (rand() < highFitShare ? 'high-fit' : 'low-fit') : 'none';
      const partnerId = engagement === 'none' ? null : PARTNERS[Math.floor(rand() * PARTNERS.length)].id;
      const m = MODEL[engagement];
      out.push({
        quarter,
        amount,
        engagement,
        partnerId,
        won: rand() < m.win,
        cycleDays: Math.round(m.days * (0.7 + rand() * 0.6)),
      });
    }
  });
  return out;
}

export interface Summary {
  deals: number;
  winRate: number;
  avgCycleDays: number;
  wonRevenue: number;
}

export function summarize(deals: ClosedDeal[]): Summary {
  const won = deals.filter((d) => d.won);
  return {
    deals: deals.length,
    winRate: deals.length ? won.length / deals.length : 0,
    avgCycleDays: deals.length ? deals.reduce((s, d) => s + d.cycleDays, 0) / deals.length : 0,
    wonRevenue: won.reduce((s, d) => s + d.amount, 0),
  };
}

export function byEngagement(deals: ClosedDeal[]): Record<Engagement, Summary> {
  return {
    none: summarize(deals.filter((d) => d.engagement === 'none')),
    'low-fit': summarize(deals.filter((d) => d.engagement === 'low-fit')),
    'high-fit': summarize(deals.filter((d) => d.engagement === 'high-fit')),
  };
}

export function influencedByQuarter(deals: ClosedDeal[]): { quarter: string; influenced: number; direct: number }[] {
  return QUARTERS.map((quarter) => {
    // Expected won revenue (amount x win rate for the engagement type): smoother than one random draw per deal.
    const q = deals.filter((d) => d.quarter === quarter);
    const expected = (ds: ClosedDeal[]) => ds.reduce((s, d) => s + d.amount * MODEL[d.engagement].win, 0);
    return {
      quarter,
      influenced: expected(q.filter((d) => d.engagement !== 'none')),
      direct: expected(q.filter((d) => d.engagement === 'none')),
    };
  });
}
