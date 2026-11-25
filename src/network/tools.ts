/**
 * Tools, split by company. Northwind's agents can read Northwind's CRM and
 * models; each partner's agent can read only that partner's own records.
 * Cross-company information moves only through send_a2a_message.
 */
import { DEALS, dealById, type Deal } from '../data/deals';
import { partnerById, PARTNERS, BLOCKER_LABEL } from '../data/partners';
import { introEmail, rankPartners } from '../lib/match';
import { MODEL } from '../lib/history';
import { HANDOFF, SAVE_ARTIFACT } from '../agent/runtime';
import type { ToolDef } from '../agent/types';
import { signalsFor } from './signals';

const obj = (properties: Record<string, unknown>, required: string[]) => ({
  type: 'object' as const,
  properties,
  required,
  additionalProperties: false,
});

function needDeal(id: unknown): Deal {
  const d = dealById(String(id));
  if (!d) throw new Error(`No deal with id "${id}". Valid ids look like "harborview".`);
  return d;
}

const band = (n: number) => (n < 250_000 ? 'under $250K' : n < 500_000 ? '$250K-$500K' : n < 1_000_000 ? '$500K-$1M' : 'over $1M');

/* ---------- Northwind tools ---------- */

const getDeal: ToolDef = {
  name: 'get_deal',
  description: 'Read a deal from the Northwind CRM: account, amount, stage, close date, blockers, last call note, cloud contract.',
  input_schema: obj({ deal_id: { type: 'string' } }, ['deal_id']),
  run: ({ deal_id }) => {
    const d = needDeal(deal_id);
    return {
      deal_id: d.id,
      account: d.account,
      industry: d.industry,
      region: d.region,
      amount_usd: d.amount,
      stage: d.stage,
      close_date: d.closeDate,
      product: d.product,
      owner: d.owner,
      champion: d.champion,
      blockers: d.blockers.map((b) => BLOCKER_LABEL[b]),
      last_call_note: d.note,
      cloud: d.cloud ? partnerById(d.cloud).name : null,
      unused_cloud_commit_usd: d.commitRemaining,
      partners_known_in_account: Object.keys(d.relationships).map((p) => partnerById(p).name),
    };
  },
};

const getSignals: ToolDef = {
  name: 'get_account_signals',
  description: 'Recent public and CRM signals for the account behind a deal: leadership changes, hiring, contracts, technology news.',
  input_schema: obj({ deal_id: { type: 'string' } }, ['deal_id']),
  run: ({ deal_id }) => signalsFor(needDeal(deal_id)),
};

const scorePartners: ToolDef = {
  name: 'score_partners',
  description: 'Score every partner in the ecosystem against a deal on six weighted factors. Returns the ranked list with reasons and risks.',
  input_schema: obj({ deal_id: { type: 'string' } }, ['deal_id']),
  run: ({ deal_id }) =>
    rankPartners(needDeal(deal_id))
      .slice(0, 5)
      .map((m) => ({
        partner_id: m.partner.id,
        partner: m.partner.name,
        type: m.partner.type,
        score: m.score,
        recommended: m.recommended,
        reasons: m.reasons,
        risks: m.risks,
      })),
};

const sendA2A: ToolDef = {
  name: 'send_a2a_message',
  description: "Send a co-sell request to a partner company's agent and get its reply. The partner decides what to share.",
  input_schema: obj(
    {
      partner_id: { type: 'string', description: `One of: ${PARTNERS.map((p) => p.id).join(', ')}` },
      message: { type: 'string' },
    },
    ['partner_id', 'message'],
  ),
  run: async ({ partner_id, message }, ctx) => {
    const p = partnerById(String(partner_id));
    const to = `partner_${p.id}`;
    ctx.emit({ kind: 'a2a', from: ctx.agent.id, to, text: String(message), direction: 'request' });
    const reply = await ctx.runAgent(to, String(message), ctx.agent);
    ctx.emit({ kind: 'a2a', from: to, to: ctx.agent.id, text: reply, direction: 'response' });
    return reply;
  },
};

const STRUCTURES = {
  marketplace_private_offer: { label: 'Marketplace private offer', feePct: 0.03, needsCloud: true },
  referral_fee: { label: 'Referral fee', feePct: 0.1, needsCloud: false },
  services_led: { label: 'Services-led co-sell', feePct: 0, needsCloud: false },
  resale: { label: 'Resale', feePct: 0.18, needsCloud: false },
} as const;

const modelEconomics: ToolDef = {
  name: 'model_deal_economics',
  description: 'Compare co-sell structures for a deal and partner: partner cost, net first-year revenue, win probability, expected value.',
  input_schema: obj(
    {
      deal_id: { type: 'string' },
      partner_id: { type: 'string' },
      structures: { type: 'array', items: { type: 'string', enum: Object.keys(STRUCTURES) } },
    },
    ['deal_id', 'partner_id', 'structures'],
  ),
  run: ({ deal_id, partner_id, structures }) => {
    const d = needDeal(deal_id);
    const p = partnerById(String(partner_id));
    const fit = rankPartners(d).find((m) => m.partner.id === p.id)!;
    const win = fit.recommended ? MODEL['high-fit'].win : MODEL['low-fit'].win;
    const solo = { structure: 'No partner', partner_cost_usd: 0, net_revenue_usd: d.amount, win_probability: MODEL.none.win, expected_value_usd: Math.round(d.amount * MODEL.none.win) };
    const rows = (structures as string[]).map((s) => {
      const st = STRUCTURES[s as keyof typeof STRUCTURES];
      if (!st) throw new Error(`Unknown structure ${s}`);
      if (st.needsCloud && d.cloud !== p.id) return { structure: st.label, available: false, why: `${d.account} does not buy on ${p.name}.` };
      const cost = Math.round(d.amount * st.feePct);
      // A marketplace offer that draws down unused commit also shortens procurement, which lifts the odds a little more.
      const commitBonus = st.needsCloud && d.commitRemaining >= d.amount ? 0.04 : 0;
      const pWin = Math.min(0.9, win + commitBonus);
      return {
        structure: st.label,
        partner_cost_usd: cost,
        net_revenue_usd: d.amount - cost,
        win_probability: Number(pWin.toFixed(2)),
        expected_value_usd: Math.round((d.amount - cost) * pWin),
      };
    });
    return { deal: d.account, partner: p.name, baseline: solo, options: rows };
  },
};

const draftIntro: ToolDef = {
  name: 'draft_partner_intro',
  description: 'Draft the intro email to a partner manager from the match reasons and the last call note.',
  input_schema: obj({ deal_id: { type: 'string' }, partner_id: { type: 'string' } }, ['deal_id', 'partner_id']),
  run: ({ deal_id, partner_id }) => {
    const d = needDeal(deal_id);
    const m = rankPartners(d).find((x) => x.partner.id === String(partner_id));
    if (!m) throw new Error(`Unknown partner ${partner_id}`);
    const e = introEmail(d, m);
    return { to: m.partner.managerEmail, subject: e.subject, body: e.body };
  },
};

/* ---------- Partner-side tools (scoped to the calling partner's own data) ---------- */

const selfPartner = (agentId: string) => partnerById(agentId.replace(/^partner_/, ''));

/** Partners look accounts up by name in their own CRM; they never see Northwind's deal ids. */
function findAccount(name: string): Deal | undefined {
  const q = name.toLowerCase().trim();
  if (!q) return undefined;
  return DEALS.find((d) => {
    const a = d.account.toLowerCase();
    return a === q || q.includes(a) || a.includes(q);
  });
}

const checkRelationship: ToolDef = {
  name: 'check_account_relationship',
  description: "Look up an account in your own company's CRM: do you have a relationship, and what kind.",
  input_schema: obj({ account: { type: 'string' } }, ['account']),
  run: ({ account }, ctx) => {
    const me = selfPartner(ctx.agent.id);
    const d = findAccount(String(account));
    const rel = d?.relationships[me.id];
    const cloudCustomer = d && me.type === 'Cloud marketplace' && d.cloud === me.id;
    if (!d || (!rel && !cloudCustomer)) return { account, relationship: 'none' };
    return {
      account: d.account,
      relationship: rel === 'active-project' ? 'active project' : rel === 'customer' ? 'existing customer' : 'cloud customer',
      detail:
        me.type === 'Cloud marketplace' && cloudCustomer
          ? `On our enterprise agreement; committed spend available this fiscal year: ${d.commitRemaining >= d.amount ? 'yes, ample' : 'some'}.`
          : rel === 'active-project'
            ? 'Our team is on site on a current engagement.'
            : 'They buy from us today; no active project.',
    };
  },
};

const checkCapacity: ToolDef = {
  name: 'check_team_capacity',
  description: "Check your own team's capacity in a region for a new co-sell engagement.",
  input_schema: obj({ region: { type: 'string' } }, ['region']),
  run: ({ region }, ctx) => {
    const me = selfPartner(ctx.agent.id);
    const covers = me.regions.some((r) => r.toLowerCase() === String(region).toLowerCase());
    if (!covers) return { region, status: 'no team in region' };
    if (me.load >= 0.75) return { region, status: 'limited', utilization: me.load, earliest_start: '2027-01-12', note: 'Can staff one senior lead now; full team from mid-January.' };
    return { region, status: 'available', utilization: me.load, earliest_start: 'within ' + me.responseDays + ' days' };
  },
};

const getTerms: ToolDef = {
  name: 'get_cosell_terms',
  description: "Your company's standard co-sell terms.",
  input_schema: obj({}, []),
  run: (_input, ctx) => {
    const me = selfPartner(ctx.agent.id);
    if (me.type === 'Cloud marketplace') return { structure: 'Marketplace private offer', fee: '3% of contract value', note: 'Counts toward the customer’s committed spend. Private offer can be live in 2 business days.' };
    if (me.type === 'Systems integrator') return { structure: 'Referral fee or services-led', fee: '10% referral fee, waived if we deliver the implementation', note: 'We prefer services-led when we already have a project at the account.' };
    return { structure: 'Reciprocal referral', fee: '8% referral fee', note: 'Joint integration support included for co-sold deals.' };
  },
};

export const TOOLS: Record<string, ToolDef> = Object.fromEntries(
  [HANDOFF, SAVE_ARTIFACT, getDeal, getSignals, scorePartners, sendA2A, modelEconomics, draftIntro, checkRelationship, checkCapacity, getTerms].map((t) => [t.name, t]),
);

export { band };
