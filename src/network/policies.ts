/**
 * Replay policies: how each agent behaves when no live model is connected.
 * They make the same tool calls a model would and build every answer from
 * real tool results, so numbers and facts in a replay come from the data.
 */
import { dealById } from '../data/deals';
import { partnerById } from '../data/partners';
import { rankPartners } from '../lib/match';
import type { Policy } from '../agent/drivers';
import type { Signal } from './signals';
import { band } from './tools';

const dealIdIn = (text: string) => text.match(/deal_id=([a-z0-9_-]+)/i)?.[1] ?? '';
const usd = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`);
const month = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

interface DealView {
  deal_id: string; account: string; industry: string; region: string; amount_usd: number; stage: string; close_date: string;
  blockers: string[]; last_call_note: string; champion: string; cloud: string | null; unused_cloud_commit_usd: number;
}
interface Scored { partner_id: string; partner: string; type: string; score: number; recommended: boolean; reasons: string[]; risks: string[] }
interface Econ { deal: string; partner: string; baseline: Row; options: (Row & { available?: boolean; why?: string })[] }
interface Row { structure: string; partner_cost_usd?: number; net_revenue_usd?: number; win_probability?: number; expected_value_usd?: number }

const strategist: Policy = (v, turn) => {
  const id = dealIdIn(v.task);
  const d = v.last<DealView>('get_deal');
  const h = (v.results.handoff ?? []) as string[];
  switch (turn) {
    case 0:
      return { say: 'Reading the deal and the co-sell playbook before I assign work.', call: [{ name: 'load_skill', input: { name: 'cosell-playbook' } }, { name: 'get_deal', input: { deal_id: id } }] };
    case 1:
      return {
        say: `Main blocker: ${d!.blockers[0].toLowerCase()}. First, research.`,
        call: [{ name: 'handoff', input: { agent_id: 'researcher', task: `Research ${d!.account} (deal_id=${id}). Focus on signals that change the blocker "${d!.blockers[0]}" and on the decision path.` } }],
      };
    case 2:
      return { call: [{ name: 'handoff', input: { agent_id: 'matcher', task: `Rank partners for ${d!.account} (deal_id=${id}) and say which two to contact first.` } }] };
    case 3: {
      const ranked = rankPartners(dealById(id)!);
      const pick = ranked.filter((m) => m.recommended).slice(0, 2);
      const contact = (pick.length >= 2 ? pick : ranked.slice(0, 2)).map((m) => m.partner.id);
      return {
        say: `Matcher shortlisted ${contact.map((p) => partnerById(p).name).join(' and ')}. Confirming with their agents.`,
        call: [{
          name: 'handoff',
          input: {
            agent_id: 'negotiator',
            task: [
              `Contact these partners: ${contact.join(', ')}.`,
              `Account: ${d!.account}`,
              `Region: ${d!.region}`,
              `Industry: ${d!.industry}`,
              `Deal size band: ${band(d!.amount_usd)}`,
              `Target close: ${month(d!.close_date)}`,
              `Blocker we need removed: ${d!.blockers[0]}`,
            ].join('\n'),
          },
        }],
      };
    }
    case 4: {
      const primary = h[2]?.match(/Primary: partner_id=([a-z]+)/)?.[1] ?? rankPartners(dealById(id)!)[0].partner.id;
      return {
        call: [{ name: 'handoff', input: { agent_id: 'dealdesk', task: `Model co-sell structures for deal_id=${id} with partner_id=${primary} and recommend one.` } }],
      };
    }
    case 5: {
      const primary = h[2]?.match(/Primary: partner_id=([a-z]+)/)?.[1] ?? rankPartners(dealById(id)!)[0].partner.id;
      return {
        say: 'All findings are in. Handing to the writer.',
        call: [{
          name: 'handoff',
          input: {
            agent_id: 'writer',
            task: `Write the co-sell plan for ${d!.account} (deal_id=${id}, partner_id=${primary}) from these findings.\n\n## Research\n${h[0]}\n\n## Partner ranking\n${h[1]}\n\n## Partner responses\n${h[2]}\n\n## Commercial terms\n${h[3]}`,
          },
        }],
      };
    }
    default: {
      const primary = h[2]?.match(/Primary: partner_id=([a-z]+)/)?.[1];
      const terms = h[3]?.split('\n')[0] ?? '';
      return {
        final: `Co-sell plan ready for ${d!.account}. Partner: ${primary ? partnerById(primary).name : 'see plan'}. ${terms} Plan and partner intro are saved for review.`,
      };
    }
  }
};

const researcher: Policy = (v, turn) => {
  const id = dealIdIn(v.task);
  if (turn === 0) {
    return {
      call: [
        { name: 'load_skill', input: { name: 'account-research' } },
        { name: 'get_deal', input: { deal_id: id } },
        { name: 'get_account_signals', input: { deal_id: id } },
      ],
    };
  }
  const d = v.last<DealView>('get_deal')!;
  const s = (v.last<Signal[]>('get_account_signals') ?? []).slice(0, 3);
  const kind = /marketplace/i.test(d.blockers[0]) ? 'cloud marketplace' : /security/i.test(d.blockers[0]) ? 'partner with pre-approved security controls or regulator relationships' : 'integrator already on site';
  return {
    final: [
      `**Situation**: ${d.account} (${d.industry}, ${d.region}) is evaluating ${usd(d.amount_usd)} of Northwind, targeting ${month(d.close_date)}. Stage: ${d.stage}.`,
      `**Signals**:`,
      ...s.map((x) => `- ${x.date}: ${x.text}`),
      `**Decision path**: champion is the ${d.champion}. The gate is: ${d.blockers[0].toLowerCase()}.`,
      `**Implication**: a ${kind} is most likely to unblock this.${d.cloud ? ` They buy on ${d.cloud} with ${usd(d.unused_cloud_commit_usd)} of unused commit.` : ''}`,
    ].join('\n'),
  };
};

const matcher: Policy = (v, turn) => {
  const id = dealIdIn(v.task);
  if (turn === 0) return { call: [{ name: 'load_skill', input: { name: 'partner-fit-scoring' } }, { name: 'score_partners', input: { deal_id: id } }] };
  const r = (v.last<Scored[]>('score_partners') ?? []).slice(0, 3);
  const contact = r.filter((m) => m.recommended).slice(0, 2);
  return {
    final: [
      ...r.map((m, i) => `${i + 1}. **${m.partner}** (${m.partner_id}), ${m.score}/100${m.recommended ? '' : ', not recommended'}. ${m.reasons.slice(0, 2).join(' ')}${m.risks.length ? ` Risk: ${m.risks[0]}` : ''}`),
      `Contact first: ${(contact.length ? contact : r.slice(0, 2)).map((m) => m.partner_id).join(', ')}.`,
    ].join('\n'),
  };
};

const negotiator: Policy = (v, turn) => {
  const ids = (v.task.match(/Contact these partners: ([^\n.]+)/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const facts = v.task.split('\n').slice(1).join('\n');
  if (turn === 0) return { call: [{ name: 'load_skill', input: { name: 'a2a-cosell-protocol' } }] };
  if (turn === 1) {
    return {
      say: `Sending co-sell requests to ${ids.length} partner agents.`,
      call: ids.map((pid) => ({
        name: 'send_a2a_message',
        input: {
          partner_id: pid,
          message: `Co-sell request from Northwind Analytics.\n${facts}\nAsk: (1) Do you have a relationship with this account? (2) Can your team engage before the target close? (3) What are your standard co-sell terms?`,
        },
      })),
    };
  }
  const replies = (v.results.send_a2a_message ?? []) as string[];
  const line = (reply: string, label: string) => (reply.match(new RegExp(`${label}: ([^\\n]+)`))?.[1] ?? '').split('. ')[0];
  const rows = ids.map((pid, i) => {
    const reply = replies[i] ?? '';
    return {
      pid,
      name: partnerById(pid).name,
      status: reply.match(/^\**(Committed|Conditional|Declined)/i)?.[1] ?? 'No reply',
      relationship: line(reply, 'Relationship'),
      capacity: line(reply, 'Capacity'),
      terms: line(reply, 'Terms'),
    };
  });
  const primary = rows.find((r) => /committed/i.test(r.status)) ?? rows.find((r) => /conditional/i.test(r.status)) ?? rows[0];
  const backup = rows.find((r) => r !== primary);
  return {
    final: [
      '| Partner | Status | Relationship | Capacity | Terms |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.name} | ${r.status} | ${r.relationship} | ${r.capacity} | ${r.terms} |`),
      '',
      `Primary: partner_id=${primary.pid} (${primary.name}, ${primary.status.toLowerCase()}).${backup ? ` Backup: ${backup.name}.` : ''}`,
    ].join('\n'),
  };
};

const partnerAgent: Policy = (v, turn) => {
  const account = v.task.match(/Account: (.+)/)?.[1]?.trim() ?? '';
  const region = v.task.match(/Region: (.+)/)?.[1]?.trim() ?? '';
  if (turn === 0) {
    return {
      call: [
        { name: 'load_skill', input: { name: 'partner-intake' } },
        { name: 'check_account_relationship', input: { account } },
        { name: 'check_team_capacity', input: { region } },
        { name: 'get_cosell_terms', input: {} },
      ],
    };
  }
  const rel = v.last<{ relationship: string; detail?: string }>('check_account_relationship')!;
  const cap = v.last<{ status: string; earliest_start?: string; note?: string }>('check_team_capacity')!;
  const terms = v.last<{ structure: string; fee: string; note: string }>('get_cosell_terms')!;
  const status = cap.status === 'no team in region' ? 'Declined' : rel.relationship === 'none' || cap.status === 'limited' ? 'Conditional' : 'Committed';
  return {
    final: [
      `**${status}**.`,
      `Relationship: ${rel.relationship}${rel.detail ? `. ${rel.detail}` : ''}`,
      `Capacity: ${cap.status === 'available' ? `available, can start ${cap.earliest_start}` : cap.status === 'limited' ? `limited. ${cap.note}` : 'no team in that region'}`,
      `Terms: ${terms.structure}, ${terms.fee}. ${terms.note}`,
    ].join('\n'),
  };
};

const dealdesk: Policy = (v, turn) => {
  const id = dealIdIn(v.task);
  const pid = v.task.match(/partner_id=([a-z]+)/)?.[1] ?? '';
  if (turn === 0) {
    const cloud = partnerById(pid).type === 'Cloud marketplace';
    return {
      call: [
        { name: 'load_skill', input: { name: 'revenue-share-design' } },
        { name: 'model_deal_economics', input: { deal_id: id, partner_id: pid, structures: cloud ? ['marketplace_private_offer', 'referral_fee'] : ['services_led', 'referral_fee'] } },
      ],
    };
  }
  const e = v.last<Econ>('model_deal_economics')!;
  const opts = e.options.filter((o) => o.available !== false);
  const best = opts.reduce((a, b) => ((b.expected_value_usd ?? 0) > (a.expected_value_usd ?? 0) ? b : a), opts[0]);
  const lift = (best.expected_value_usd ?? 0) - (e.baseline.expected_value_usd ?? 0);
  return {
    final: [
      `Recommend: ${best.structure} with ${e.partner}: partner cost ${usd(best.partner_cost_usd ?? 0)}, net ${usd(best.net_revenue_usd ?? 0)}, win probability ${Math.round((best.win_probability ?? 0) * 100)}%.`,
      `Expected value ${usd(best.expected_value_usd ?? 0)} vs ${usd(e.baseline.expected_value_usd ?? 0)} going alone (+${usd(lift)}).`,
      ...e.options.filter((o) => o !== best).map((o) => (o.available === false ? `${o.structure}: not available. ${o.why}` : `${o.structure}: expected value ${usd(o.expected_value_usd ?? 0)}.`)),
    ].join('\n'),
  };
};

const writer: Policy = (v, turn) => {
  const id = dealIdIn(v.task);
  const pid = v.task.match(/partner_id=([a-z]+)/)?.[1] ?? '';
  const d = dealById(id)!;
  const p = partnerById(pid);
  if (turn === 0) return { call: [{ name: 'load_skill', input: { name: 'account-plan-writing' } }, { name: 'draft_partner_intro', input: { deal_id: id, partner_id: pid } }] };
  if (turn === 1) {
    const section = (h: string) => v.task.split(`## ${h}\n`)[1]?.split('\n## ')[0]?.trim() ?? '';
    const terms = section('Commercial terms');
    const email = v.last<{ to: string; subject: string; body: string }>('draft_partner_intro')!;
    const plan = [
      `# Co-sell plan: ${d.account}`,
      `**Summary.** ${usd(d.amount)} ${d.product} deal, ${d.stage.toLowerCase()} stage, closing ${month(d.closeDate)}. Blocked by: ${d.note} Co-sell with **${p.name}**. ${terms.split('\n')[0]}`,
      `## Account research`,
      section('Research'),
      `## Why ${p.name}`,
      section('Partner ranking'),
      `## Partner responses`,
      section('Partner responses').replace(/\nPrimary: .*$/, ''),
      `## Commercial terms`,
      terms,
      `## Risks`,
      `- Partner timing slips past the close date. Mitigation: confirm a named partner lead this week.`,
      `- Customer stakeholders change. Mitigation: brief the ${d.champion} on the partner plan before the next call.`,
      `## Next steps`,
      `1. ${d.owner}: send the partner intro to ${p.manager} today.`,
      `2. ${d.owner} and ${p.manager}: joint call with the ${d.champion} within 5 business days.`,
      `3. Deal desk: paper the agreed structure before ${month(d.closeDate)}.`,
    ].join('\n\n');
    return {
      call: [
        { name: 'save_artifact', input: { title: `Co-sell plan: ${d.account}`, markdown: plan } },
        { name: 'save_artifact', input: { title: `Intro to ${p.name}`, markdown: `**To:** ${email.to}\n\n**Subject:** ${email.subject}\n\n${email.body}` } },
      ],
    };
  }
  return { final: `Saved "Co-sell plan: ${d.account}" and "Intro to ${p.name}".` };
};

export const POLICIES: Record<string, Policy> = {
  strategist,
  researcher,
  matcher,
  negotiator,
  dealdesk,
  writer,
  ...Object.fromEntries(['stratus', 'nimbus', 'meridian', 'keystone', 'halden', 'pipewise', 'ledgerline', 'arcadia'].map((p) => [`partner_${p}`, partnerAgent])),
};
