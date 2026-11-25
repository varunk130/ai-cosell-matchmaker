import { describe, expect, test } from 'vitest';
import { runMission } from '../agent/runtime';
import { ReplayDriver } from '../agent/drivers';
import { SKILLS, parseSkill } from '../agent/skills';
import type { TraceEvent } from '../agent/types';
import { AGENTS, MISSIONS } from './agents';
import { POLICIES } from './policies';
import { TOOLS } from './tools';

const network = { agents: AGENTS, tools: TOOLS };

async function replay(missionId: string) {
  const m = MISSIONS.find((x) => x.id === missionId)!;
  const events: TraceEvent[] = [];
  const res = await runMission(m.lead, m.brief, { network, driver: new ReplayDriver(POLICIES), onEvent: (e) => events.push(e) });
  return { ...res, events };
}

describe('skills', () => {
  test('every skill an agent lists exists and parses', () => {
    for (const a of Object.values(AGENTS)) for (const s of a.skills) expect(SKILLS[s], `${a.id} -> ${s}`).toBeDefined();
    expect(Object.keys(SKILLS).length).toBe(7);
  });
  test('rejects a skill without frontmatter', () => {
    expect(() => parseSkill('# no frontmatter')).toThrow();
  });
});

describe('agents and tools', () => {
  test('every tool an agent lists is registered', () => {
    for (const a of Object.values(AGENTS)) for (const t of a.tools) expect(TOOLS[t], `${a.id} -> ${t}`).toBeDefined();
  });
  test('partner agents cannot read Northwind data', () => {
    for (const a of Object.values(AGENTS).filter((x) => x.id.startsWith('partner_'))) {
      expect(a.tools).not.toContain('get_deal');
      expect(a.tools).not.toContain('score_partners');
    }
  });
});

describe.each(MISSIONS.map((m) => m.id))('mission %s (replay)', (id) => {
  test('runs end to end and saves a plan and an intro', async () => {
    const { output, state, events } = await replay(id);
    const artifacts = state.artifacts as { title: string; body: string }[];
    expect(artifacts.map((a) => a.title)).toEqual([expect.stringMatching(/^Co-sell plan/), expect.stringMatching(/^Intro to/)]);
    expect(artifacts[0].body).toMatch(/## Next steps/);
    expect(output).toMatch(/Co-sell plan ready/);
    expect(events.filter((e) => e.kind === 'error')).toEqual([]);
    expect(events.some((e) => e.kind === 'tool_result' && e.isError)).toBe(false);
  });

  test('talks to two partner companies agent to agent and every agent loads a skill', async () => {
    const { events } = await replay(id);
    const requests = events.filter((e) => e.kind === 'a2a' && e.direction === 'request');
    expect(requests).toHaveLength(2);
    const started = new Set(events.filter((e) => e.kind === 'agent_start').map((e) => (e as { agent: string }).agent));
    const loaded = new Set(events.filter((e) => e.kind === 'skill').map((e) => (e as { agent: string }).agent));
    for (const a of started) expect(loaded.has(a), `${a} loaded a skill`).toBe(true);
    expect(started.size).toBe(8); // 6 Northwind agents + 2 partner agents
  });
});

test('A2A requests share a size band, never the exact contract value', async () => {
  const { dealById } = await import('../data/deals');
  for (const m of MISSIONS) {
    const amount = dealById(m.id)!.amount;
    const exact = [`$${Math.round(amount / 1000)}K`, amount.toLocaleString('en-US'), String(amount)];
    const { events } = await replay(m.id);
    for (const e of events) {
      if (e.kind !== 'a2a' || e.direction !== 'request') continue;
      for (const s of exact) expect(e.text).not.toContain(s);
      expect(e.text).toMatch(/Deal size band: /);
    }
  }
});

test('Harborview picks Stratus Cloud and a marketplace private offer', async () => {
  const { state } = await replay('harborview');
  const plan = (state.artifacts as { body: string }[])[0].body;
  expect(plan).toMatch(/Co-sell with \*\*Stratus Cloud\*\*/);
  expect(plan).toMatch(/Marketplace private offer/);
});
