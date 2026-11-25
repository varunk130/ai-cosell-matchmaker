import { describe, expect, test } from 'vitest';
import { DEALS, dealById } from '../data/deals';
import { PARTNERS } from '../data/partners';
import { bestMatch, factorsFor, introEmail, rankPartners, scoreOf } from './match';
import { MODEL, byEngagement, generateHistory } from './history';

const deal = (id: string) => dealById(id)!;
const partner = (id: string) => PARTNERS.find((p) => p.id === id)!;

describe('factors', () => {
  test('all factors stay between 0 and 1', () => {
    for (const d of DEALS)
      for (const p of PARTNERS)
        for (const v of Object.values(factorsFor(d, p))) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
  });

  test('a marketplace only helps if the customer buys on that cloud', () => {
    const harborview = deal('harborview'); // on Stratus, wants marketplace procurement
    expect(factorsFor(harborview, partner('stratus')).blocker).toBe(1);
    expect(factorsFor(harborview, partner('nimbus')).blocker).toBe(0);
    expect(factorsFor(harborview, partner('nimbus')).commit).toBe(0);
  });

  test('an active project counts more than a customer relationship', () => {
    expect(factorsFor(deal('avalon'), partner('meridian')).relationship).toBe(1);
    expect(factorsFor(deal('brightline'), partner('meridian')).relationship).toBe(0.6);
  });

  test('score is a weighted sum out of 100', () => {
    expect(scoreOf({ blocker: 1, relationship: 1, commit: 1, industry: 1, region: 1, trackRecord: 1 })).toBe(100);
    expect(scoreOf({ blocker: 0, relationship: 0, commit: 0, industry: 0, region: 0, trackRecord: 0 })).toBe(0);
  });
});

describe('ranking', () => {
  test('picks the partner that solves the main blocker', () => {
    expect(bestMatch(deal('harborview'))?.partner.id).toBe('stratus');
    expect(bestMatch(deal('cobalt'))?.partner.id).toBe('keystone');
    expect(bestMatch(deal('fairway'))?.partner.id).toBe('pipewise');
    expect(bestMatch(deal('delmar'))?.partner.id).toBe('halden');
  });

  test('is sorted by score and every deal gets a recommendation', () => {
    for (const d of DEALS) {
      const r = rankPartners(d);
      for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
      expect(bestMatch(d)).not.toBeNull();
    }
  });

  test('recommended partners always cover the region and solve a blocker', () => {
    for (const d of DEALS)
      for (const m of rankPartners(d).filter((x) => x.recommended)) {
        expect(m.factors.region).toBe(1);
        expect(m.factors.blocker).toBeGreaterThan(0);
      }
  });

  test('flags an overloaded partner as a risk', () => {
    const m = rankPartners(deal('brightline')).find((x) => x.partner.id === 'meridian')!;
    expect(m.risks.join(' ')).toMatch(/capacity/);
  });

  test('explains the commit in dollars', () => {
    const m = bestMatch(deal('harborview'))!;
    expect(m.reasons.join(' ')).toMatch(/\$820K of unused Stratus Cloud commit/);
  });
});

describe('intro email', () => {
  test('addresses the partner manager and includes the reasons and call note', () => {
    const d = deal('harborview');
    const m = bestMatch(d)!;
    const e = introEmail(d, m);
    expect(e.body.startsWith('Hi Dana,')).toBe(true);
    expect(e.body).toContain(d.note);
    expect(e.body).toContain('private offer');
    expect(e.subject).toContain('Harborview Hotels');
  });
});

describe('history', () => {
  test('high-fit partners win clearly more often than no partner', () => {
    const e = byEngagement(generateHistory());
    expect(e['high-fit'].winRate).toBeGreaterThan(e.none.winRate * 1.6);
    expect(e['high-fit'].avgCycleDays).toBeLessThan(e.none.avgCycleDays);
    expect(MODEL['high-fit'].win).toBeGreaterThan(MODEL['low-fit'].win);
  });
});
