import { useMemo } from 'react';
import { DEALS } from '../data/deals';
import { BLOCKER_LABEL, PARTNERS } from '../data/partners';
import { bestMatch } from '../lib/match';
import { Avatar, money, pct } from '../components/ui';

export function PartnersView() {
  const topMatches = useMemo(() => {
    const m = new Map<string, { count: number; amount: number; deals: string[] }>();
    for (const d of DEALS) {
      const best = bestMatch(d);
      if (!best) continue;
      const cur = m.get(best.partner.id) ?? { count: 0, amount: 0, deals: [] };
      cur.count++;
      cur.amount += d.amount;
      cur.deals.push(d.account);
      m.set(best.partner.id, cur);
    }
    return m;
  }, []);

  const sorted = [...PARTNERS].sort((a, b) => (topMatches.get(b.id)?.amount ?? 0) - (topMatches.get(a.id)?.amount ?? 0));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Partners</h1>
          <p>Who your pipeline needs this quarter, and whether they have the capacity to show up.</p>
        </div>
      </div>
      <div className="halves">
        {sorted.map((p) => {
          const tm = topMatches.get(p.id);
          const loadColor = p.load >= 0.75 ? 'var(--bad)' : p.load >= 0.55 ? 'var(--warn)' : 'var(--good)';
          return (
            <section className="card card-pad stack" key={p.id} style={{ gap: 14 }}>
              <div className="row" style={{ flexWrap: 'nowrap', gap: 12 }}>
                <Avatar partner={p} size="lg" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row between">
                    <strong style={{ fontSize: 15 }}>{p.name}</strong>
                    {tm ? <span className="pill accent">Top match on {tm.count} {tm.count === 1 ? 'deal' : 'deals'}</span> : <span className="pill">No top matches</span>}
                  </div>
                  <div className="small muted">
                    {p.type} · {p.manager}
                  </div>
                </div>
              </div>
              <p className="ink2">{p.pitch}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div>
                  <div className="small muted">Pipeline they fit</div>
                  <div className="score" style={{ fontSize: 17 }}>{tm ? money(tm.amount) : '—'}</div>
                </div>
                <div>
                  <div className="small muted">Co-sell win rate</div>
                  <div className="score" style={{ fontSize: 17 }}>{pct(p.winRate)}</div>
                </div>
                <div>
                  <div className="small muted">Time to engage</div>
                  <div className="score" style={{ fontSize: 17 }}>{p.responseDays} days</div>
                </div>
              </div>
              <div>
                <div className="row between small" style={{ marginBottom: 4 }}>
                  <span className="muted">Team capacity used this quarter</span>
                  <span style={{ color: loadColor, fontWeight: 650 }}>
                    {p.load >= 0.75 ? '▲ ' : ''}
                    {pct(p.load)}
                  </span>
                </div>
                <div className="meter">
                  <div style={{ width: pct(p.load), background: loadColor }} />
                </div>
              </div>
              <div className="tags">
                {p.solves.map((b) => (
                  <span key={b} className="pill">
                    {BLOCKER_LABEL[b]}
                  </span>
                ))}
              </div>
              {tm && <div className="small muted">Best fit for: {tm.deals.join(', ')}</div>}
            </section>
          );
        })}
      </div>
    </>
  );
}
