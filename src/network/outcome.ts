/** Turns a finished run's trace into the headline outcome for the demo. Reads tool results, so it works for replay and live runs alike. */
import type { TraceEvent } from '../agent/types';

export interface Outcome {
  headline: string;
  tiles: { label: string; value: string; hint?: string }[];
}

const money = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`);

function lastResult<T>(events: TraceEvent[], tool: string): T | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.kind === 'tool_result' && e.tool === tool && !e.isError) return e.output as T;
  }
  return undefined;
}

interface Econ {
  deal: string;
  partner: string;
  baseline: { expected_value_usd: number; win_probability: number };
  options: { structure: string; available?: boolean; expected_value_usd?: number; win_probability?: number; partner_cost_usd?: number }[];
}

export function outcomeOf(events: TraceEvent[]): Outcome | null {
  const econ = lastResult<Econ>(events, 'model_deal_economics');
  const ranked = lastResult<{ partner: string; score: number }[]>(events, 'score_partners');
  const artifacts = events.filter((e) => e.kind === 'artifact');
  if (!econ || artifacts.length === 0) return null;
  const opts = econ.options.filter((o) => o.available !== false && o.expected_value_usd !== undefined);
  const best = opts.reduce((a, b) => ((b.expected_value_usd ?? 0) > (a.expected_value_usd ?? 0) ? b : a), opts[0]);
  const score = ranked?.find((r) => r.partner === econ.partner)?.score;
  const a2a = events.filter((e) => e.kind === 'a2a' && e.direction === 'request').length;
  return {
    headline: `${econ.deal}: co-sell with ${econ.partner} via ${best.structure.toLowerCase()}`,
    tiles: [
      { label: 'Partner chosen', value: econ.partner, hint: score !== undefined ? `fit score ${score}/100` : undefined },
      { label: 'Win probability', value: `${Math.round(econ.baseline.win_probability * 100)}% → ${Math.round((best.win_probability ?? 0) * 100)}%`, hint: 'alone vs. with this partner' },
      { label: 'Expected value', value: `+${money((best.expected_value_usd ?? 0) - econ.baseline.expected_value_usd)}`, hint: `${money(econ.baseline.expected_value_usd)} → ${money(best.expected_value_usd ?? 0)}` },
      { label: 'Partner cost', value: money(best.partner_cost_usd ?? 0), hint: best.structure },
      { label: 'Partners contacted', value: String(a2a), hint: 'agent to agent, across company lines' },
    ],
  };
}
