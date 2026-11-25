import { useMemo, type ReactNode } from 'react';
import { MODEL, QUARTERS, byEngagement, generateHistory, influencedByQuarter, summarize } from '../lib/history';
import { DEALS } from '../data/deals';
import { PARTNERS, type PartnerType } from '../data/partners';
import { bestMatch } from '../lib/match';
import { AreaTrend, ColorBars, Donut, Funnel, Legend, Sparkline, StackedColumns } from '../components/charts';
import { money, pct } from '../components/ui';

const TYPE_COLOR: Record<PartnerType, string> = {
  'Cloud marketplace': 'var(--type-cloud)',
  'Systems integrator': 'var(--type-si)',
  'Software partner': 'var(--type-sw)',
};
const TYPE_LABEL: Record<PartnerType, string> = { 'Cloud marketplace': 'Cloud marketplaces', 'Systems integrator': 'Integrators', 'Software partner': 'Software partners' };
const FIT = [
  { label: 'No partner', key: 'none' as const, color: 'var(--fit-0)' },
  { label: 'Low-fit partner', key: 'low-fit' as const, color: 'var(--fit-1)' },
  { label: 'High-fit partner', key: 'high-fit' as const, color: 'var(--fit-2)' },
];
const short = (q: string) => q.replace(' FY', "'");
const $m = (v: number) => (v === 0 ? '$0' : `$${(v / 1_000_000).toFixed(v < 10_000_000 ? 1 : 0)}M`);

function Card({ title, sub, children, wide }: { title: string; sub: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className="card" style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
      </div>
      <div className="card-pad">{children}</div>
    </section>
  );
}

function SparkKpi({ label, value, hint, spark }: { label: string; value: ReactNode; hint: string; spark?: number[] }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="kpi-spark">
        <div>
          <div className="value">{value}</div>
          <div className="hint">{hint}</div>
        </div>
        {spark && <Sparkline values={spark} color="var(--fit-2)" />}
      </div>
    </div>
  );
}

export function ImpactView() {
  const history = useMemo(() => generateHistory(), []);
  const eng = byEngagement(history);
  const all = summarize(history);
  const quarters = influencedByQuarter(history);
  const share = quarters.map((q) => q.influenced / (q.influenced + q.direct));

  const funnel = useMemo(() => {
    const engaged = history.filter((d) => d.engagement !== 'none');
    const high = engaged.filter((d) => d.engagement === 'high-fit');
    return [
      { label: 'Closed deals', value: history.length, color: 'var(--fit-0)', ink: 'var(--fit-ink-0)' },
      { label: 'Partner engaged', value: engaged.length, color: 'var(--fit-1)' },
      { label: 'High-fit partner', value: high.length, color: 'var(--fit-2)', ink: 'var(--fit-ink-2)' },
      { label: 'Won', value: high.filter((d) => d.won).length, color: 'var(--good)', ink: 'var(--won-ink)' },
    ];
  }, [history]);

  const byPartner = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of DEALS) {
      const b = bestMatch(d);
      if (b) m.set(b.partner.id, (m.get(b.partner.id) ?? 0) + d.amount);
    }
    return PARTNERS.map((p) => ({ p, amount: m.get(p.id) ?? 0 }))
      .filter((x) => x.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, []);
  const byType = (Object.keys(TYPE_COLOR) as PartnerType[]).map((t) => ({
    label: TYPE_LABEL[t],
    color: TYPE_COLOR[t],
    value: byPartner.filter((x) => x.p.type === t).reduce((s, x) => s + x.amount, 0),
  }));
  const pipeline = byType.reduce((s, x) => s + x.value, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Impact</h1>
          <p>What the right partner is worth, across {all.deals} closed deals in six quarters.</p>
        </div>
      </div>

      <div className="kpis">
        <SparkKpi label="Win rate, high-fit partner" value={<span style={{ color: 'var(--good)' }}>{pct(eng['high-fit'].winRate)}</span>} hint={`vs ${pct(eng.none.winRate)} with no partner`} />
        <SparkKpi label="Sales cycle, high-fit partner" value={`${Math.round(eng['high-fit'].avgCycleDays)} days`} hint={`${Math.round(eng.none.avgCycleDays - eng['high-fit'].avgCycleDays)} days faster than alone`} />
        <SparkKpi label="Partner share of revenue" value={pct(share[share.length - 1])} hint={`up from ${pct(share[0])} in ${QUARTERS[0]}`} spark={share} />
        <SparkKpi label="Partner-influenced revenue" value={$m(quarters[quarters.length - 1].influenced)} hint={`per quarter, up ${Math.round(quarters[quarters.length - 1].influenced / quarters[0].influenced)}x`} spark={quarters.map((q) => q.influenced)} />
      </div>

      <div className="halves">
        <Card title="Win rate by partner fit" sub="Any partner barely helps. The right one nearly doubles it.">
          <ColorBars items={FIT.map((f) => ({ key: f.key, label: f.label, value: eng[f.key].winRate, display: pct(eng[f.key].winRate), color: f.color, note: `${eng[f.key].deals} deals` }))} />
        </Card>
        <Card title="Days to close by partner fit" sub="High-fit partners shorten the cycle by a month.">
          <ColorBars items={FIT.map((f) => ({ key: f.key, label: f.label, value: eng[f.key].avgCycleDays, display: `${Math.round(eng[f.key].avgCycleDays)} days`, color: f.color }))} />
        </Card>

        <Card title="Revenue won, by quarter" sub="Partner-influenced is now half of expected revenue.">
          <Legend items={[{ label: 'Partner-influenced', color: 'var(--fit-2)' }, { label: 'Direct', color: 'var(--rev-direct)' }]} />
          <StackedColumns
            categories={quarters.map((q) => short(q.quarter))}
            series={[
              { name: 'Direct', color: 'var(--rev-direct)', values: quarters.map((q) => q.direct) },
              { name: 'Partner-influenced', color: 'var(--fit-2)', values: quarters.map((q) => q.influenced) },
            ]}
            format={$m}
            height={250}
            ariaLabel="Stacked columns of direct and partner-influenced expected revenue per quarter"
          />
        </Card>
        <Card title="Partner share of revenue" sub={`From ${pct(share[0])} to ${pct(share[share.length - 1])} in six quarters.`}>
          <AreaTrend labels={quarters.map((q) => short(q.quarter))} values={share.map((s) => s * 100)} color="var(--fit-2)" format={(v) => `${Math.round(v)}%`} yMax={60} height={270} ariaLabel="Area chart of partner share of expected revenue by quarter" />
        </Card>

        <Card title="Co-sell funnel" sub="From every closed deal to wins with the right partner.">
          <Funnel steps={funnel} />
          <p className="small muted" style={{ margin: '12px 0 0' }}>
            Right-hand column: share of the step above.
          </p>
        </Card>
        <Card title="Open pipeline by partner type" sub="Where this half’s matched pipeline sits.">
          <Donut items={byType} format={money} centerLabel="matched pipeline" ariaLabel={`Donut of ${money(pipeline)} matched pipeline by partner type`} />
        </Card>

        <Card title="Where partners matter this half" sub="Open pipeline each partner is the best fit for." wide>
          <Legend items={byType.map((t) => ({ label: t.label, color: t.color }))} />
          <ColorBars
            items={byPartner.map((x) => ({
              key: x.p.id,
              label: <strong style={{ color: 'var(--ink)' }}>{x.p.name}</strong>,
              value: x.amount,
              display: money(x.amount),
              color: TYPE_COLOR[x.p.type],
              note: TYPE_LABEL[x.p.type],
            }))}
          />
        </Card>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Fit is scored 0–100 on six factors. Pipeline lift uses {pct(MODEL.none.win)} alone vs {pct(MODEL['high-fit'].win)} with a high-fit partner. All data is
        synthetic.
      </p>
    </>
  );
}
