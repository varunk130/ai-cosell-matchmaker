import { useMemo, useState } from 'react';
import { DEALS, STAGES, type Stage } from '../data/deals';
import { bestMatch } from '../lib/match';
import { MODEL } from '../lib/history';
import { Kpi, PartnerName, ScorePill, StagePill, money, shortDate } from '../components/ui';
import type { CoSellStatus } from '../App';

const STATUS_PILL: Record<CoSellStatus, { cls: string; label: string }> = {
  none: { cls: '', label: 'Not started' },
  drafted: { cls: 'warn', label: 'Intro drafted' },
  requested: { cls: 'good', label: 'Co-sell requested' },
};

export function PipelineView({ status }: { status: Record<string, CoSellStatus> }) {
  const [stage, setStage] = useState<Stage | 'All'>('All');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => DEALS.map((d) => ({ deal: d, match: bestMatch(d) })), []);
  const visible = rows.filter(
    ({ deal }) => (stage === 'All' || deal.stage === stage) && `${deal.account} ${deal.owner} ${deal.industry}`.toLowerCase().includes(query.toLowerCase()),
  );

  const open = rows.reduce((s, r) => s + r.deal.amount, 0);
  const matched = rows.filter((r) => r.match);
  const matchedAmount = matched.reduce((s, r) => s + r.deal.amount, 0);
  const lift = matched.reduce((s, r) => s + r.deal.amount * (MODEL['high-fit'].win - MODEL.none.win), 0);
  const engaged = Object.values(status).filter((s) => s === 'requested').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pipeline</h1>
          <p>Every open deal, with the partner most likely to help you win it. Click a deal to see why and draft the intro.</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi label="Open pipeline" value={money(open)} hint={`${rows.length} deals this half`} />
        <Kpi label="Deals with a strong partner fit" value={`${matched.length} of ${rows.length}`} hint={`${money(matchedAmount)} of pipeline`} />
        <Kpi
          label="Expected revenue lift"
          value={<span className="delta-up">+{money(lift)}</span>}
          hint={`Win rate ${Math.round(MODEL.none.win * 100)}% alone vs ${Math.round(MODEL['high-fit'].win * 100)}% with a high-fit partner`}
        />
        <Kpi label="Co-sell requests sent" value={engaged} hint={engaged ? 'Partners notified' : 'None yet'} />
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Filter by stage">
            {(['All', ...STAGES] as const).map((s) => (
              <button key={s} aria-pressed={stage === s} onClick={() => setStage(s)}>
                {s}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Search accounts, owners, industries" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: '1 1 220px', maxWidth: 320, marginLeft: 'auto' }} aria-label="Search deals" />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th className="num">Amount</th>
                <th>Stage</th>
                <th>Close</th>
                <th>Best partner</th>
                <th>Fit</th>
                <th>Co-sell</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ deal, match }) => (
                <tr key={deal.id} className="link" onClick={() => (window.location.hash = `#/deal/${deal.id}`)}>
                  <td>
                    <a href={`#/deal/${deal.id}`} className="cell-title">
                      {deal.account}
                    </a>
                    <div className="cell-sub">
                      {deal.industry} · {deal.region} · {deal.owner}
                    </div>
                  </td>
                  <td className="num cell-title">{money(deal.amount)}</td>
                  <td>
                    <StagePill stage={deal.stage} />
                  </td>
                  <td className="ink2" style={{ whiteSpace: 'nowrap' }}>
                    {shortDate(deal.closeDate)}
                  </td>
                  <td>{match ? <PartnerName partner={match.partner} /> : <span className="muted">No strong fit</span>}</td>
                  <td>{match && <ScorePill score={match.score} recommended={match.recommended} />}</td>
                  <td>
                    <span className={`pill ${STATUS_PILL[status[deal.id] ?? 'none'].cls}`}>{STATUS_PILL[status[deal.id] ?? 'none'].label}</span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>
                    No deals match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
