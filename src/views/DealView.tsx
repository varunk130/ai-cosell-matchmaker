import { useMemo, useState } from 'react';
import { dealById } from '../data/deals';
import { BLOCKER_LABEL, partnerById } from '../data/partners';
import { FACTORS, introEmail, rankPartners, type Match } from '../lib/match';
import { Avatar, Modal, PartnerName, ScorePill, ScoreRing, StagePill, money, shortDate } from '../components/ui';
import { IconAlert, IconArrowLeft, IconCheck, IconMail, IconSend, IconSparkle } from '../components/icons';
import type { CoSellStatus } from '../App';

interface Props {
  id: string;
  status: CoSellStatus;
  setStatus: (s: CoSellStatus) => void;
  toast: (msg: string) => void;
}

/** Short label for the factor contributing most to a partner's score. */
function strongest(m: Match): string {
  const top = FACTORS.reduce((best, f) => (m.factors[f.key] * f.weight > m.factors[best.key] * best.weight ? f : best), FACTORS[0]);
  return m.factors[top.key] > 0 ? top.label.toLowerCase() : 'weak fit';
}

function FactorBreakdown({ m }: { m: Match }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {FACTORS.map((f) => (
        <div className="factor" key={f.key} title={f.help}>
          <span className="ink2">{f.label}</span>
          <div className="track">
            <div className="fill" style={{ width: `${m.factors[f.key] * 100}%` }} />
          </div>
          <span className="v">{Math.round(m.factors[f.key] * f.weight * 100)}</span>
        </div>
      ))}
    </div>
  );
}

export function DealView({ id, status, setStatus, toast }: Props) {
  const deal = dealById(id);
  const ranked = useMemo(() => (deal ? rankPartners(deal) : []), [deal]);
  const [selected, setSelected] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!deal) {
    return (
      <div className="card card-pad">
        Deal not found. <a href="#/pipeline" style={{ color: "var(--accent-text)" }}>Back to pipeline</a>
      </div>
    );
  }

  const m = ranked[selected];
  const email = introEmail(deal, m);

  const openComposer = () => {
    setDraft(email.body);
    setComposing(true);
    if (status === 'none') setStatus('drafted');
  };
  const send = () => {
    setComposing(false);
    setStatus('requested');
    toast(`Co-sell request sent to ${m.partner.manager} at ${m.partner.name}`);
  };

  return (
    <>
      <a className="crumb" href="#/pipeline">
        <IconArrowLeft width={14} height={14} /> Pipeline
      </a>
      <div className="page-head">
        <div>
          <h1>{deal.account}</h1>
          <p className="row" style={{ marginTop: 8, gap: 8 }}>
            <StagePill stage={deal.stage} />
            <span className="ink2">
              {money(deal.amount)} · {deal.product} · closes {shortDate(deal.closeDate)} · {deal.owner}
            </span>
          </p>
        </div>
        {status === 'requested' ? (
          <span className="pill good" style={{ padding: '6px 12px' }}>
            <IconCheck width={14} height={14} /> Co-sell requested
          </span>
        ) : (
          <button className="btn primary" onClick={openComposer} disabled={!m.recommended}>
            <IconMail /> Draft intro to {m.partner.name}
          </button>
        )}
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Why this deal is stuck</h2>
            </div>
            <div className="card-pad stack" style={{ gap: 14 }}>
              <ol className="reasons risk">
                {deal.blockers.map((b, i) => (
                  <li key={b}>
                    <IconAlert />
                    <span>
                      {BLOCKER_LABEL[b]}
                      {i === 0 && <span className="pill warn" style={{ marginLeft: 8 }}>Main blocker</span>}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="quote">“{deal.note}”</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Account</h2>
            </div>
            <dl className="card-pad facts" style={{ margin: 0 }}>
              <dt>Industry</dt>
              <dd>{deal.industry}</dd>
              <dt>Region</dt>
              <dd>{deal.region}</dd>
              <dt>Employees</dt>
              <dd>{deal.employees.toLocaleString()}</dd>
              <dt>Champion</dt>
              <dd>{deal.champion}</dd>
              <dt>Cloud</dt>
              <dd>{deal.cloud ? `${partnerById(deal.cloud).name} · ${money(deal.commitRemaining)} unused commit` : 'No cloud contract'}</dd>
              <dt>Partners inside</dt>
              <dd>
                {Object.entries(deal.relationships).length
                  ? Object.entries(deal.relationships)
                      .map(([pid, rel]) => `${partnerById(pid).name} (${rel === 'active-project' ? 'active project' : 'customer'})`)
                      .join(', ')
                  : 'None'}
              </dd>
            </dl>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>{selected === 0 ? 'Recommended partner' : 'Partner detail'}</h2>
                <div className="ai-note" style={{ marginTop: 2 }}>
                  <IconSparkle /> Ranked from CRM, partner, and marketplace data
                </div>
              </div>
              {selected !== 0 && (
                <button className="btn" onClick={() => setSelected(0)}>
                  Back to top match
                </button>
              )}
            </div>
            <div className="card-pad stack" style={{ gap: 18 }}>
              <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
                <ScoreRing score={m.score} />
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Avatar partner={m.partner} />
                    <strong style={{ fontSize: 16 }}>{m.partner.name}</strong>
                    {!m.recommended && <span className="pill">Not recommended</span>}
                  </div>
                  <div className="ink2 small" style={{ marginTop: 4 }}>
                    {m.partner.type} · Partner manager {m.partner.manager} · usually engages in {m.partner.responseDays} days
                  </div>
                </div>
              </div>

              {m.reasons.length > 0 && (
                <div>
                  <div className="small muted" style={{ marginBottom: 8, fontWeight: 550 }}>
                    WHY THIS PARTNER
                  </div>
                  <ul className="reasons">
                    {m.reasons.map((r) => (
                      <li key={r}>
                        <IconCheck />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {m.risks.length > 0 && (
                <div>
                  <div className="small muted" style={{ marginBottom: 8, fontWeight: 550 }}>
                    WATCH OUT
                  </div>
                  <ul className="reasons risk">
                    {m.risks.map((r) => (
                      <li key={r}>
                        <IconAlert />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="small muted" style={{ marginBottom: 8, fontWeight: 550 }}>
                  SCORE BREAKDOWN
                </div>
                <FactorBreakdown m={m} />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>All partners, ranked</h2>
              <p>Click one to compare</p>
            </div>
            <div className="table-wrap">
              <table>
                <tbody>
                  {ranked.map((r, i) => (
                    <tr key={r.partner.id} className="link" onClick={() => setSelected(i)} style={i === selected ? { background: 'var(--accent-soft)' } : undefined}>
                      <td style={{ width: 28 }} className="muted">
                        {i + 1}
                      </td>
                      <td>
                        <PartnerName partner={r.partner} sub={`${r.partner.type} · ${strongest(r)}`} />
                      </td>
                      <td className="num">
                        <ScorePill score={r.score} recommended={r.recommended} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {composing && (
        <Modal
          title={`Intro to ${m.partner.manager}, ${m.partner.name}`}
          onClose={() => setComposing(false)}
          footer={
            <>
              <button className="btn" onClick={() => setComposing(false)}>
                Save draft
              </button>
              <button className="btn primary" onClick={send}>
                <IconSend /> Send co-sell request
              </button>
            </>
          }
        >
          <div className="stack" style={{ gap: 10 }}>
            <div className="small ink2">
              <strong>To:</strong> {m.partner.managerEmail}
              <br />
              <strong>Subject:</strong> {email.subject}
            </div>
            <div className="ai-note">
              <IconSparkle /> Drafted from the match reasons and your last call notes. Edit before sending.
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Email body" />
          </div>
        </Modal>
      )}
    </>
  );
}
