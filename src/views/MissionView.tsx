import { useEffect, useMemo, useRef, useState } from 'react';
import { runMission } from '../agent/runtime';
import { LiveDriver, ReplayDriver, liveAvailable } from '../agent/drivers';
import type { AgentDef, TraceEvent } from '../agent/types';
import { AGENTS, MISSIONS, NORTHWIND_IDS } from '../network/agents';
import { POLICIES } from '../network/policies';
import { TOOLS } from '../network/tools';
import { outcomeOf } from '../network/outcome';
import { Markdown } from '../components/Markdown';
import { IconSparkle } from '../components/icons';

type Mode = 'replay' | 'live';
const SPEEDS = { '1x': 420, '3x': 140, Instant: 0 } as const;
type Speed = keyof typeof SPEEDS;
type Status = 'idle' | 'working' | 'done';

const network = { agents: AGENTS, tools: TOOLS };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const agentName = (id: string) => AGENTS[id]?.name ?? id;

function Avatar({ a, size = 26 }: { a: AgentDef; size?: number }) {
  return (
    <span className="avatar" style={{ background: a.color, width: size, height: size, fontSize: size * 0.38, borderRadius: size * 0.28 }} aria-hidden="true">
      {a.initials}
    </span>
  );
}

function compact(v: unknown, max = 140): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function Event({ e, depth }: { e: TraceEvent; depth: number }) {
  const pad = { marginLeft: Math.min(depth, 3) * 18 };
  switch (e.kind) {
    case 'agent_start': {
      const a = AGENTS[e.agent];
      return (
        <div className="ev ev-start" style={pad}>
          <Avatar a={a} size={22} />
          <div>
            <strong>{a.name}</strong> <span className="muted">· {a.org}</span>
            <details>
              <summary>{e.from ? `Task from ${agentName(e.from)}` : 'Mission brief'}</summary>
              <pre className="ev-pre">{e.task}</pre>
            </details>
          </div>
        </div>
      );
    }
    case 'skill':
      return (
        <div className="ev" style={pad}>
          <span className="chip-skill">
            <IconSparkle width={12} height={12} /> loaded skill <code>{e.skill}</code>
          </span>
        </div>
      );
    case 'text':
      return (
        <div className="ev ev-say" style={pad}>
          “{e.text}”
        </div>
      );
    case 'tool_call':
      if (e.tool === 'load_skill' || e.tool === 'handoff' || e.tool === 'send_a2a_message') return null;
      return (
        <div className="ev" style={pad}>
          <div className="ev-tool">
            <code className="tool-name">{e.tool}</code>
            <code className="tool-args">{compact(e.input, 90)}</code>
          </div>
        </div>
      );
    case 'tool_result':
      if (e.tool === 'load_skill' || e.tool === 'handoff' || e.tool === 'send_a2a_message') return null;
      return (
        <div className="ev" style={pad}>
          <details className={`ev-result${e.isError ? ' err' : ''}`}>
            <summary>
              {e.isError ? 'error' : 'result'}: {compact(e.output, 100)}
            </summary>
            <pre className="ev-pre">{typeof e.output === 'string' ? e.output : JSON.stringify(e.output, null, 2)}</pre>
          </details>
        </div>
      );
    case 'handoff':
      return (
        <div className="ev ev-handoff" style={pad}>
          → handoff to <strong>{agentName(e.to)}</strong>
        </div>
      );
    case 'a2a': {
      const from = AGENTS[e.from];
      const to = AGENTS[e.to];
      return (
        <div className={`ev ev-a2a ${e.direction}`} style={pad}>
          <div className="a2a-head">
            <span className="a2a-tag">A2A</span> {from.org} → {to.org}
          </div>
          <pre className="ev-pre a2a-body">{e.text}</pre>
        </div>
      );
    }
    case 'agent_end':
      return (
        <div className="ev ev-end" style={pad}>
          <details>
            <summary>
              ✓ <strong>{agentName(e.agent)}</strong> finished
            </summary>
            <div className="ev-output">
              <Markdown text={e.output} />
            </div>
          </details>
        </div>
      );
    case 'artifact':
      return (
        <div className="ev" style={pad}>
          <span className="pill good">Saved “{e.title}”</span>
        </div>
      );
    case 'error':
      return (
        <div className="ev" style={pad}>
          <span className="pill bad">{e.text}</span>
        </div>
      );
    default:
      return null;
  }
}

export function MissionView() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [mode, setMode] = useState<Mode>('replay');
  const [speed, setSpeed] = useState<Speed>('1x');
  const [live, setLive] = useState(false);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const traceEnd = useRef<HTMLDivElement>(null);
  const deliverableRef = useRef<HTMLElement>(null);
  const [timing, setTiming] = useState<{ start: number; end?: number } | null>(null);

  useEffect(() => {
    liveAvailable().then(setLive);
  }, []);
  useEffect(() => {
    // Keep the newest event in view by scrolling the trace panel only, never the page.
    const panel = traceEnd.current?.parentElement;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [events.length]);

  const mission = MISSIONS.find((m) => m.id === missionId)!;

  const run = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setEvents([]);
    setError(null);
    setTab(0);
    setRunning(true);
    setTiming({ start: Date.now() });
    try {
      await runMission(mission.lead, mission.brief, {
        network,
        driver: mode === 'live' ? new LiveDriver() : new ReplayDriver(POLICIES),
        onEvent: (e) => setEvents((xs) => [...xs, e]),
        pace: mode === 'replay' ? () => (SPEEDS[speedRef.current] ? sleep(SPEEDS[speedRef.current]) : Promise.resolve()) : undefined,
        signal: ctrl.signal,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      if (abort.current === ctrl) {
        setRunning(false);
        setTiming((t) => (t ? { ...t, end: Date.now() } : t));
      }
    }
  };
  const stop = () => {
    abort.current?.abort();
    setRunning(false);
  };

  // Derived views of the trace
  const depthOf = useMemo(() => {
    const d: Record<string, number> = {};
    for (const e of events) if (e.kind === 'agent_start') d[e.agent] = e.depth;
    return d;
  }, [events]);
  const status = useMemo(() => {
    const s: Record<string, Status> = {};
    for (const e of events) {
      if (e.kind === 'agent_start') s[e.agent] = 'working';
      if (e.kind === 'agent_end') s[e.agent] = 'done';
    }
    return s;
  }, [events]);
  const skillsLoaded = useMemo(() => {
    const s: Record<string, string[]> = {};
    for (const e of events) if (e.kind === 'skill') (s[e.agent] ??= []).push(e.skill);
    return s;
  }, [events]);
  const artifacts = events.filter((e): e is Extract<TraceEvent, { kind: 'artifact' }> => e.kind === 'artifact');
  const count = (k: TraceEvent['kind']) => events.filter((e) => e.kind === k).length;
  const toolCalls = events.filter((e) => e.kind === 'tool_call' && e.tool !== 'load_skill' && e.tool !== 'handoff' && e.tool !== 'send_a2a_message').length;
  const tokens = events.reduce((s, e) => (e.kind === 'usage' ? s + e.inputTokens + e.outputTokens : s), 0);
  const partnerIds = Object.keys(AGENTS).filter((id) => !NORTHWIND_IDS.includes(id));
  const engagedPartners = partnerIds.filter((id) => status[id]);
  const outcome = !running && !error ? outcomeOf(events) : null;
  const seconds = timing?.end ? Math.max(1, Math.round((timing.end - timing.start) / 1000)) : null;
  const activeId = [...events].reverse().find((e) => e.kind === 'agent_start' || e.kind === 'tool_call' || e.kind === 'skill' || e.kind === 'text') as { agent?: string } | undefined;

  const agentRow = (id: string) => {
    const a = AGENTS[id];
    const st = status[id] ?? 'idle';
    return (
      <li key={id} className={`roster-row ${st}${running && activeId?.agent === id ? ' active' : ''}`}>
        <Avatar a={a} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row between" style={{ flexWrap: 'nowrap' }}>
            <span className="cell-title">{a.name}</span>
            <span className={`status-dot ${st}`} title={st} />
          </div>
          <div className="cell-sub">{(skillsLoaded[id] ?? a.skills).map((s) => s).join(', ')}</div>
        </div>
      </li>
    );
  };

  return (
    <>
      <nav className="present-steps" aria-label="Presentation flow" style={{ marginBottom: 14 }}>
        <a href="#/">
          <b>1</b> The story
        </a>
        <span className="arrow">→</span>
        <span className={outcome ? '' : 'on'} style={outcome ? { padding: '6px 12px' } : undefined}>
          <b>2</b> Live demo
        </span>
        <span className="arrow">→</span>
        <span className={outcome ? 'on' : ''} style={outcome ? undefined : { padding: '6px 12px', opacity: 0.6 }}>
          <b>3</b> Outcome and artifact
        </span>
      </nav>
      <div className="page-head">
        <div>
          <h1>Agent network</h1>
          <p>
            Six Northwind agents and one agent per partner company work a deal end to end: research, match, confirm agent to agent across company
            lines, price it, and write the plan. Every step, skill, and tool call shows in the trace.
          </p>
        </div>
      </div>

      <section className="card mission-bar">
        <div className="missions" role="radiogroup" aria-label="Mission">
          {MISSIONS.map((m) => (
            <button key={m.id} role="radio" aria-checked={m.id === missionId} className="mission" onClick={() => setMissionId(m.id)} disabled={running}>
              <strong>{m.title}</strong>
              <span className="cell-sub">{m.summary}</span>
            </button>
          ))}
        </div>
        <div className="row mission-controls">
          <div className="seg" role="group" aria-label="Mode">
            <button aria-pressed={mode === 'replay'} onClick={() => setMode('replay')} disabled={running}>
              Replay
            </button>
            <button aria-pressed={mode === 'live'} onClick={() => setMode('live')} disabled={running || !live} title={live ? 'Run on Claude' : 'Set ANTHROPIC_API_KEY and restart npm run dev to enable'}>
              Live (Claude)
            </button>
          </div>
          {mode === 'replay' && (
            <div className="seg" role="group" aria-label="Speed">
              {(Object.keys(SPEEDS) as Speed[]).map((s) => (
                <button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <span className="small muted mode-note">{mode === 'live' ? 'Agents decide on a live model; tools run on demo data.' : live ? 'Scripted decisions, real tools.' : 'Scripted decisions, real tools. Live mode needs an API key.'}</span>
          {running ? (
            <button className="btn" onClick={stop}>
              Stop
            </button>
          ) : (
            <button className="btn primary" onClick={run}>
              ▶ Run mission
            </button>
          )}
        </div>
      </section>

      {outcome && (
        <section className="outcome" aria-label="Mission outcome">
          <div className="outcome-top">
            <div>
              <div className="outcome-kicker">✓ Mission complete{seconds ? ` · ${seconds}s` : ''}</div>
              <h2>{outcome.headline}</h2>
              <div className="outcome-meta">
                {Object.keys(status).length} agents across {new Set(Object.keys(status).map((id) => AGENTS[id].org)).size} companies · {toolCalls} tool calls ·{' '}
                {count('skill')} skills loaded · {artifacts.length} deliverables saved
              </div>
            </div>
            <button className="btn primary" onClick={() => deliverableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Read the co-sell plan ↓
            </button>
          </div>
          <div className="outcome-tiles">
            {outcome.tiles.map((t) => (
              <div className="outcome-tile" key={t.label}>
                <div className="k">{t.label}</div>
                <div className="v">{t.value}</div>
                {t.hint && <div className="h">{t.hint}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mission-stats">
        <div><span className="score">{Object.keys(status).length}</span> agents</div>
        <div><span className="score">{count('skill')}</span> skills loaded</div>
        <div><span className="score">{toolCalls}</span> tool calls</div>
        <div><span className="score">{count('a2a')}</span> A2A messages</div>
        <div><span className="score">{count('handoff')}</span> handoffs</div>
        {tokens > 0 && <div><span className="score">{tokens.toLocaleString()}</span> tokens</div>}
      </div>

      {error && (
        <div className="card card-pad" style={{ borderColor: 'var(--bad)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--bad)' }}>Run failed.</strong> {error}
        </div>
      )}

      <div className="mission-grid">
        <section className="card">
          <div className="card-head">
            <h2>Northwind team</h2>
          </div>
          <ul className="roster">{NORTHWIND_IDS.map(agentRow)}</ul>
          <div className="card-head" style={{ borderTop: '1px solid var(--line)' }}>
            <div>
              <h2>Partner companies</h2>
              <p>Separate orgs, own data, own agent</p>
            </div>
          </div>
          <ul className="roster">{(engagedPartners.length ? engagedPartners : partnerIds.slice(0, 4)).map(agentRow)}</ul>
          {!engagedPartners.length && <p className="small muted" style={{ padding: '0 16px 14px' }}>+{partnerIds.length - 4} more. Agents join when contacted.</p>}
        </section>

        <section className="card trace-card">
          <div className="card-head">
            <h2>Trace</h2>
            <p>{running ? 'Running…' : events.length ? `${events.length} events` : 'Press Run mission'}</p>
          </div>
          <div className="trace" aria-live="polite">
            {events.length === 0 && (
              <div className="empty">
                <p>The trace shows each agent starting, the skills it loads, every tool call and result, and the messages that cross company lines.</p>
              </div>
            )}
            {events.map((e) => {
              const agent = 'agent' in e ? e.agent : 'from' in e ? e.from : '';
              const node = <Event e={e} depth={depthOf[agent] ?? 0} />;
              return node ? <div key={e.seq}>{node}</div> : null;
            })}
            <div ref={traceEnd} />
          </div>
        </section>

        <section className="card" ref={deliverableRef} style={{ scrollMarginTop: 16 }}>
          <div className="card-head">
            <h2>Deliverables</h2>
          </div>
          {artifacts.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}>
              <p>The co-sell plan and partner intro appear here when the writer saves them.</p>
            </div>
          ) : (
            <>
              <div className="toolbar">
                <div className="seg" role="tablist">
                  {artifacts.map((a, i) => (
                    <button key={a.seq} role="tab" aria-pressed={tab === i} onClick={() => setTab(i)}>
                      {a.title.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-pad deliverable">
                <Markdown text={artifacts[Math.min(tab, artifacts.length - 1)].body} />
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
