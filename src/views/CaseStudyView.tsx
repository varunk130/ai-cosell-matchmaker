import { useMemo } from 'react';
import { DEALS } from '../data/deals';
import { bestMatch } from '../lib/match';
import { MODEL } from '../lib/history';
import { AGENTS, NORTHWIND_IDS } from '../network/agents';
import { PARTNERS } from '../data/partners';
import { SKILLS } from '../agent/skills';
import { Rings } from '../components/Rings';
import { money } from '../components/ui';
import '../case-study.css';

const SOURCES = [
  { n: 1, text: 'Canalys, "Hyperscaler cloud marketplace sales to hit US$85 billion by 2028," August 2024.', url: 'https://canalys.com/newsroom/hyperscaler-cloud-marketplace' },
  { n: 2, text: 'Forrester, "The State Of Partner Ecosystems In 2025" and Partner Ecosystem Marketing Survey, 2026.', url: 'https://www.forrester.com/blogs/the-state-of-partner-ecosystems-2025/' },
  { n: 3, text: 'Forrester, "B2B Buyer Preferences Offer An Undeniable Indicator Of Partner Ecosystem Importance" (survey of 10,000+ B2B purchase influencers).', url: 'https://www.forrester.com/report/b2b-buyer-preferences-offer-an-undeniable-indicator-of-partner-ecosystem-importance/RES179588' },
];
const Ref = ({ n }: { n: number }) => (
  <sup>
    <a href={`#src-${n}`}>[{n}]</a>
  </sup>
);

export function CaseStudyView() {
  const m = useMemo(() => {
    const rows = DEALS.map((d) => ({ d, match: bestMatch(d) }));
    const pipeline = rows.reduce((s, r) => s + r.d.amount, 0);
    const matched = rows.filter((r) => r.match);
    const lift = matched.reduce((s, r) => s + r.d.amount * (MODEL['high-fit'].win - MODEL.none.win), 0);
    return { pipeline, deals: rows.length, matched: matched.length, lift };
  }, []);

  const team = NORTHWIND_IDS.map((id) => AGENTS[id]);
  const partners = Object.values(AGENTS).filter((a) => a.id.startsWith('partner_'));
  const go = (hash: string) => (window.location.hash = hash);

  return (
    <div className="cs">
      <nav className="present-steps" aria-label="Presentation flow">
        <span className="on">
          <b>1</b> The story · 2–4 min
        </span>
        <span className="arrow">→</span>
        <a href="#/agents">
          <b>2</b> Live demo
        </a>
        <span className="arrow">→</span>
        <a href="#/agents">
          <b>3</b> Outcome and artifact
        </a>
      </nav>
      <header className="cs-hero">
        <span className="cs-kicker">Case study · B2B partnerships · Agent-to-agent</span>
        <h1>The right partner nearly doubles a deal’s odds. AI agents find and engage them in minutes, not days.</h1>
        <p className="lede">
          A network of AI agents that picks the partner for each deal, agrees terms directly with that partner’s own agent, and hands the seller a
          ready co-sell plan.
        </p>
        <div className="cs-hero-stats">
          <div className="cs-hero-stat">
            <div className="v">$85B</div>
            <div className="k">marketplace software sales by 2028 [1]</div>
          </div>
          <div className="cs-hero-stat">
            <div className="v">
              {Math.round(MODEL.none.win * 100)}% → {Math.round(MODEL['high-fit'].win * 100)}%
            </div>
            <div className="k">win rate: no partner vs. right partner*</div>
          </div>
          <div className="cs-hero-stat">
            <div className="v">+{money(m.lift)}</div>
            <div className="k">expected lift on {money(m.pipeline)} pipeline*</div>
          </div>
          <div className="cs-hero-stat">
            <div className="v">
              {team.length} + {partners.length}
            </div>
            <div className="k">agents: your team + one per partner</div>
          </div>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>*Demo data. Market figures cited below.</p>
        <div className="cs-hero-actions">
          <button className="cs-btn" onClick={() => go('#/agents')}>
            ▶ Watch the agents work a deal
          </button>
          <button className="cs-btn ghost" onClick={() => go('#/pipeline')}>
            Open the pipeline
          </button>
        </div>
      </header>

      

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">1</span>
          <div>
            <h2>The problem</h2>
            <p>Partnerships are where B2B growth comes from, and the motion to use them is still manual.</p>
          </div>
        </div>
        <div className="cs-cards">
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-3)' }}>
            <div className="ico">?</div>
            <h3>Wrong partner, or none</h3>
            <p>Partners are assigned by territory, not by what blocks the deal.</p>
          </div>
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-2)' }}>
            <div className="ico">⏱</div>
            <h3>Days of cross-company email</h3>
            <p>Relationship, capacity, and terms each live in another company’s systems.</p>
          </div>
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-1)' }}>
            <div className="ico">$</div>
            <h3>Money left on the table</h3>
            <p>Unused cloud commit could pay for the deal, and sellers rarely know it’s there.</p>
          </div>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">2</span>
          <div>
            <h2>How big is the opportunity</h2>
            <p>Partner-led and marketplace selling is becoming the default route to buy enterprise software.</p>
          </div>
        </div>
        <div className="cs-market">
          <div className="cs-rings">
            <Rings
              layers={[
                { label: 'TAM', value: '$85B', color: '#4338ca' },
                { label: 'SAM', value: '~$43B', color: '#6d28d9' },
                { label: 'FIRST SLICE', value: '~$4B', color: '#a21caf' },
              ]}
            />
          </div>
          <div>
            <div className="cs-layers">
              <div className="cs-layer">
                <span className="sw" style={{ background: '#4338ca' }} />
                <div>
                  <div className="t">Total market</div>
                  <div className="v">
                    $85B by 2028 <Ref n={1} />
                  </div>
                  <div className="d">Enterprise software sold through hyperscaler cloud marketplaces, growing from $16B in 2023.</div>
                </div>
              </div>
              <div className="cs-layer">
                <span className="sw" style={{ background: '#6d28d9' }} />
                <div>
                  <div className="t">Serviceable: partner-led</div>
                  <div className="v">
                    ~$43B <Ref n={1} />
                  </div>
                  <div className="d">More than half of marketplace sales are expected to flow through channel partners by 2027: the co-sell motion PartnerFit automates.</div>
                </div>
              </div>
              <div className="cs-layer">
                <span className="sw" style={{ background: '#a21caf' }} />
                <div>
                  <div className="t">First slice (our assumption)</div>
                  <div className="v">~$4B</div>
                  <div className="d">10% of partner-led sales: deals blocked by procurement, integration, or security, where the right partner is the unlock.</div>
                </div>
              </div>
            </div>
            <div className="cs-growth" aria-label="Marketplace sales growth">
              <div className="cs-growth-row">
                <span>2023</span>
                <div className="bar" style={{ width: `${(16 / 85) * 100}%` }} />
                <span className="val">$16B</span>
              </div>
              <div className="cs-growth-row">
                <span>2028 forecast</span>
                <div className="bar" style={{ width: '100%' }} />
                <span className="val">$85B</span>
              </div>
            </div>
          </div>
        </div>
        <p className="cs-note">
          Also: $360B+ of committed cloud spend can pay for marketplace purchases <Ref n={1} />; ~70% of B2B buyers buy through a partner <Ref n={3} />.
          First slice is our assumption, not a forecast.
        </p>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">3</span>
          <div>
            <h2>Why now</h2>
            <p>Three shifts make an agent network the right shape for this problem today.</p>
          </div>
        </div>
        <div className="cs-cards">
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-1)' }}>
            <div className="big">5x</div>
            <h3>Marketplaces are scaling</h3>
            <p>Marketplace sales grow about 5x from 2023 to 2028 [1]. Every deal involves two companies.</p>
          </div>
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-2)' }}>
            <div className="big">A2A</div>
            <h3>Agents can talk to agents</h3>
            <p>Two companies’ agents can agree fit and terms without sharing databases.</p>
          </div>
          <div className="cs-card" style={{ ['--tone' as string]: 'var(--cs-3)' }}>
            <div className="big">Skills</div>
            <h3>Expertise is now portable</h3>
            <p>The best partner manager’s playbook, followed by every agent, every time.</p>
          </div>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">4</span>
          <div>
            <h2>How it works</h2>
            <p>One mission, six specialists, and a conversation with another company’s agent in the middle.</p>
          </div>
        </div>
        <div className="cs-flow" style={{ ['--steps' as string]: 6 }}>
          {[
            ['Diagnose', 'Names the real blocker on the deal.'],
            ['Research', 'Finds what changed at the customer and who decides.'],
            ['Match', 'Ranks every partner on 6 factors, with reasons.'],
            ['Confirm (A2A)', 'Asks the partner’s own agent: relationship, capacity, terms.'],
            ['Price', 'Compares deal structures on expected value.'],
            ['Deliver', 'Saves the co-sell plan and partner intro.'],
          ].map(([t, d], i) => (
            <div key={t} className={`cs-step${i === 3 ? ' ext' : ''}`} style={{ ['--tone' as string]: i === 3 ? 'var(--cs-4)' : 'var(--cs-1)' }}>
              <span className="n">{i + 1}</span>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="cs-legend">
          <span>
            <i style={{ background: 'var(--cs-1)' }} />
            Your company’s agents
          </span>
          <span>
            <i style={{ background: 'var(--cs-4)' }} />
            Crosses into a partner company
          </span>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">5</span>
          <div>
            <h2>The AI team</h2>
            <p>Your deal team on one side, each partner company’s agent on the other. They meet only through agent-to-agent messages.</p>
          </div>
        </div>
        <div className="cs-lanes">
          {[
            {
              title: 'Your deal team · Northwind',
              desc: 'Works the deal from diagnosis to a ready co-sell plan.',
              tone: '#4338ca',
              rows: [
                ['DS', 'Deal Strategist', 'Owns the deal plan and coordinates the team.'],
                ['AR', 'Account Researcher', 'Finds what changed at the customer and who decides.'],
                ['PM', 'Partner Matcher', 'Picks the partner that removes the blocker.'],
                ['CN', 'Co-sell Negotiator', 'Confirms the partner is in, directly with their agent.'],
                ['DD', 'Deal Desk', 'Recommends the deal structure and terms.'],
                ['PW', 'Plan Writer', 'Writes the plan and the partner intro.'],
              ],
            },
            {
              title: 'Cloud marketplaces',
              desc: 'Let customers buy on their existing cloud bill.',
              tone: '#6d28d9',
              rows: PARTNERS.filter((p) => p.type === 'Cloud marketplace').map((p) => [p.initials, p.name, p.pitch]),
            },
            {
              title: 'Integrators and software partners',
              desc: 'Remove integration, migration, and security blockers.',
              tone: '#86198f',
              rows: PARTNERS.filter((p) => p.type !== 'Cloud marketplace').map((p) => [p.initials, p.name, p.pitch]),
            },
          ].map((lane) => (
            <div className="cs-lane" key={lane.title} style={{ ['--tone' as string]: lane.tone }}>
              <div className="cs-lane-head">
                <div className="t">{lane.title}</div>
                <div className="d">{lane.desc}</div>
              </div>
              <div className="cs-lane-rows">
                {lane.rows.map(([ini, name, what]) => (
                  <div className="cs-lane-row" key={name}>
                    <span className="av">{ini}</span>
                    <div>
                      <div className="n">{name}</div>
                      <div className="w">{what}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="cs-team-foot">
          <div>
            <strong>Runs on written playbooks</strong>
            Each agent follows a short playbook (a “skill”) the partner team owns and can edit in plain language. {Object.keys(SKILLS).length} in total.
          </div>
          <div>
            <strong>Each company keeps its data</strong>
            Partner agents answer from their own systems and decide what to share; your side shares a deal-size band, not contract values.
          </div>
          <div>
            <strong>Fully traceable</strong>
            Every decision, message, and number is recorded, so a seller can see exactly why a partner was chosen.
          </div>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">6</span>
          <div>
            <h2>Results in the demo</h2>
            <p>On a synthetic pipeline of {m.deals} deals and eight partners.</p>
          </div>
        </div>
        <div className="cs-results">
          <div className="cs-result">
            <div className="v">{(MODEL['high-fit'].win / MODEL.none.win).toFixed(1)}x</div>
            <div className="k">win rate with a high-fit partner vs. none</div>
          </div>
          <div className="cs-result">
            <div className="v">−{MODEL.none.days - MODEL['high-fit'].days} days</div>
            <div className="k">shorter sales cycle with a high-fit partner</div>
          </div>
          <div className="cs-result">
            <div className="v">+{money(m.lift)}</div>
            <div className="k">expected revenue from matching the right partner on each deal</div>
          </div>
          <div className="cs-result">
            <div className="v">1 run</div>
            <div className="k">from deal to plan, terms, and intro; every step visible in the trace</div>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: 18 }}>
          <table className="cs-compare">
            <thead>
              <tr>
                <th>Step</th>
                <th>Today</th>
                <th>With PartnerFit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pick a partner</td>
                <td>Whoever owns the territory</td>
                <td>Ranked by what blocks this deal, with reasons</td>
              </tr>
              <tr>
                <td>Confirm fit and capacity</td>
                <td>Days of email between companies</td>
                <td>Agent-to-agent in one exchange</td>
              </tr>
              <tr>
                <td>Agree terms</td>
                <td>Back-and-forth with deal desk</td>
                <td>Structures compared on expected value</td>
              </tr>
              <tr>
                <td>Write it up</td>
                <td>Seller writes the plan and intro</td>
                <td>Drafted from the evidence, ready to send</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">7</span>
          <div>
            <h2>Guardrails and risks</h2>
            <p>Cross-company agents only work if both sides trust what crosses the line.</p>
          </div>
        </div>
        <div className="cs-split">
          <ul className="cs-list">
            <li>
              <span>
                <strong>Data stays home.</strong> Partner agents use only their own tools; your agents reach partner data only through A2A messages.
              </span>
            </li>
            <li>
              <span>
                <strong>Need-to-know sharing.</strong> Requests carry a deal-size band, never contract values or other partners’ names. Tests enforce it.
              </span>
            </li>
            <li>
              <span>
                <strong>Human sends.</strong> Agents draft; the seller reviews and sends the intro.
              </span>
            </li>
          </ul>
          <ul className="cs-list warn">
            <li>
              <span>
                <strong>Garbage in.</strong> Matching is only as good as CRM and partner data; the score is explained so sellers can spot bad inputs.
              </span>
            </li>
            <li>
              <span>
                <strong>Partner adoption.</strong> A2A needs partners to run an agent. Fallback: the same request goes out as a drafted email.
              </span>
            </li>
            <li>
              <span>
                <strong>Over-automation.</strong> Commercial terms are recommendations for the deal desk, not commitments.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="cs-section">
        <div className="cs-head">
          <span className="cs-num">8</span>
          <div>
            <h2>What’s next</h2>
          </div>
        </div>
        <div className="cs-roadmap">
          <div className="cs-phase" style={{ ['--tone' as string]: 'var(--cs-1)' }}>
            <div className="when">Pilot</div>
            <h4>One partner, one segment</h4>
            <p>Connect to the CRM and one cloud marketplace. Measure win rate and cycle time on matched vs. unmatched deals.</p>
          </div>
          <div className="cs-phase" style={{ ['--tone' as string]: 'var(--cs-2)' }}>
            <div className="when">Scale</div>
            <h4>Open the A2A endpoint</h4>
            <p>Publish the co-sell protocol so partners can plug in their own agents, with audit logs on every exchange.</p>
          </div>
          <div className="cs-phase" style={{ ['--tone' as string]: 'var(--cs-3)' }}>
            <div className="when">Expand</div>
            <h4>From deals to the program</h4>
            <p>Use outcomes to tune the scoring skill, rebalance partner investment, and forecast partner-influenced revenue.</p>
          </div>
        </div>
      </section>

      <div className="cs-cta">
        <div>
          <h3>See it run</h3>
          <p>Pick a deal and watch {team.length + 2} agents across three companies work it end to end.</p>
        </div>
        <button className="cs-btn" onClick={() => go('#/agents')}>
          ▶ Run a mission
        </button>
      </div>

      <footer className="cs-sources">
        <strong>Sources.</strong> Market figures are from the published sources below; all company, deal, and performance figures in the demo are
        synthetic.
        <ol>
          {SOURCES.map((s) => (
            <li key={s.n} id={`src-${s.n}`}>
              {s.text}{' '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.url.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            </li>
          ))}
        </ol>
      </footer>
    </div>
  );
}
