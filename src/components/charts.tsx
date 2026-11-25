/**
 * Small, dependency-free charts for the Impact dashboard. Every chart labels
 * its values directly (color is never the only encoding) and has a hover
 * tooltip. Colors come from CSS variables with validated light and dark steps.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

function useWidth<T extends HTMLElement>(fallback = 520): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

interface Tip {
  x: number;
  y: number;
  body: ReactNode;
}
function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="tooltip" style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 10px))' }}>
      {tip.body}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="viz-legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Horizontal bars, one color per bar ---------- */

export interface BarItem {
  label: ReactNode;
  key: string;
  value: number;
  display: string;
  color: string;
  note?: string;
}

export function ColorBars({ items, max }: { items: BarItem[]; max?: number }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1e-9);
  const [tip, setTip] = useState<Tip | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <div className="cbars" ref={wrap} onMouseLeave={() => setTip(null)}>
      {items.map((i) => (
        <div
          className="cbar-row"
          key={i.key}
          onMouseMove={(e) => {
            const r = wrap.current!.getBoundingClientRect();
            setTip({ x: e.clientX - r.left, y: e.clientY - r.top, body: <><div className="t">{i.label}</div><div>{i.display}{i.note ? ` · ${i.note}` : ''}</div></> });
          }}
        >
          <span className="cbar-label">{i.label}</span>
          <span className="cbar-track">
            <span className="cbar-fill" style={{ width: `${Math.max(2, (i.value / top) * 100)}%`, background: i.color }} />
          </span>
          <span className="cbar-val">{i.display}</span>
        </div>
      ))}
      <Tooltip tip={tip} />
    </div>
  );
}

/* ---------- Stacked columns ---------- */

export function StackedColumns(props: {
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  format: (v: number) => string;
  height?: number;
  ariaLabel: string;
}) {
  const { categories, series, format, height = 250, ariaLabel } = props;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { top: 12, right: 8, bottom: 28, left: 46 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;
  const totals = categories.map((_, i) => series.reduce((s, x) => s + x.values[i], 0));
  const maxT = Math.max(...totals);
  const step = 10 ** Math.floor(Math.log10(maxT / 4));
  const tickStep = [1, 2, 2.5, 5, 10].map((k) => k * step).find((s) => s * 4 >= maxT)!;
  const yMax = Math.ceil(maxT / tickStep) * tickStep;
  const ticks = Array.from({ length: Math.round(yMax / tickStep) + 1 }, (_, i) => i * tickStep);
  const band = iw / categories.length;
  const bw = Math.min(46, band * 0.58);
  const sy = (v: number) => m.top + ih - (v / yMax) * ih;

  return (
    <div className="chart" ref={ref} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis' : 'gridline'} x1={m.left} x2={m.left + iw} y1={sy(t)} y2={sy(t)} />
            <text x={m.left - 8} y={sy(t) + 4} textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        {categories.map((c, i) => {
          const x = m.left + band * i + (band - bw) / 2;
          let acc = 0;
          return (
            <g key={c} onMouseEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.55}>
              <rect x={m.left + band * i} y={m.top} width={band} height={ih} fill="transparent" />
              {series.map((s, si) => {
                const v = s.values[i];
                const y0 = sy(acc);
                acc += v;
                const y1 = sy(acc);
                const h = Math.max(0, y0 - y1 - (si < series.length - 1 ? 0 : 0));
                const isTop = si === series.length - 1;
                return (
                  <path
                    key={s.name}
                    d={
                      isTop
                        ? `M${x},${y0} V${y1 + 4} Q${x},${y1} ${x + 4},${y1} H${x + bw - 4} Q${x + bw},${y1} ${x + bw},${y1 + 4} V${y0} Z`
                        : `M${x},${y0} V${y0 - h + 1} H${x + bw} V${y0} Z`
                    }
                    fill={s.color}
                  />
                );
              })}
              {/* 2px surface gap between stacked segments */}
              {series.slice(0, -1).map((_, si) => {
                const y = sy(series.slice(0, si + 1).reduce((s, x) => s + x.values[i], 0));
                return <line key={si} x1={x} x2={x + bw} y1={y} y2={y} stroke="var(--surface)" strokeWidth={2} />;
              })}
              <text x={x + bw / 2} y={sy(totals[i]) - 6} textAnchor="middle" className="label" style={{ fontSize: 11 }}>
                {format(totals[i])}
              </text>
              <text x={x + bw / 2} y={m.top + ih + 18} textAnchor="middle">
                {c}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(width - 170, m.left + band * hover + band / 2 + 12), top: 8 }}>
          <div className="t">{categories[hover]}</div>
          {[...series].reverse().map((s) => (
            <div className="r" key={s.name}>
              <span>
                <span className="sw" style={{ background: s.color }} />
                {s.name}
              </span>
              <span>{format(s.values[hover])}</span>
            </div>
          ))}
          <div className="r" style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 4 }}>
            <span>Total</span>
            <span>{format(totals[hover])}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Area trend with gradient fill ---------- */

export function AreaTrend(props: { labels: string[]; values: number[]; color: string; format: (v: number) => string; height?: number; ariaLabel: string; yMax?: number }) {
  const { labels, values, color, format, height = 250, ariaLabel } = props;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');
  const m = { top: 22, right: 18, bottom: 28, left: 40 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;
  const yMax = props.yMax ?? Math.max(...values) * 1.15;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * yMax);
  const sx = (i: number) => m.left + (i / (labels.length - 1)) * iw;
  const sy = (v: number) => m.top + ih - (v / yMax) * ih;
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(v)}`).join('');
  const area = `${line} L${sx(values.length - 1)},${sy(0)} L${sx(0)},${sy(0)} Z`;
  const last = values.length - 1;

  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? 'axis' : 'gridline'} x1={m.left} x2={m.left + iw} y1={sy(t)} y2={sy(t)} />
            <text x={m.left - 8} y={sy(t) + 4} textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => (
          <circle key={i} cx={sx(i)} cy={sy(v)} r={i === last || i === hover ? 5.5 : 3.5} fill={i === last || i === hover ? color : 'var(--surface)'} stroke={color} strokeWidth={2} />
        ))}
        <text x={sx(last)} y={sy(values[last]) - 12} textAnchor="end" className="label">
          {format(values[last])}
        </text>
        <text x={sx(0)} y={sy(values[0]) - 12} textAnchor="start" className="label" style={{ fontWeight: 500 }}>
          {format(values[0])}
        </text>
        {labels.map((l, i) => (
          <text key={l} x={sx(i)} y={m.top + ih + 18} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>
            {l}
          </text>
        ))}
        {hover !== null && <line x1={sx(hover)} x2={sx(hover)} y1={m.top} y2={m.top + ih} stroke="var(--axis)" />}
        <rect
          x={m.left}
          y={m.top}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.round(((e.clientX - r.left) / r.width) * last));
          }}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(width - 160, Math.max(0, sx(hover) - 70)), top: 0 }}>
          <div className="t">{labels[hover]}</div>
          <div>{format(values[hover])}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut ---------- */

export function Donut(props: { items: { label: string; value: number; color: string }[]; format: (v: number) => string; centerLabel: string; ariaLabel: string }) {
  const { items, format, centerLabel, ariaLabel } = props;
  const [hover, setHover] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + i.value, 0);
  const size = 200;
  const r = 82;
  const w = 26;
  const c = size / 2;
  let a0 = -Math.PI / 2;
  const gap = 0.025;
  const arcs = items.map((it) => {
    const a = (it.value / total) * Math.PI * 2;
    const s = a0 + gap / 2;
    const e = a0 + a - gap / 2;
    a0 += a;
    const p = (ang: number, rad: number) => `${c + rad * Math.cos(ang)},${c + rad * Math.sin(ang)}`;
    const large = e - s > Math.PI ? 1 : 0;
    return `M${p(s, r)} A${r},${r} 0 ${large} 1 ${p(e, r)} L${p(e, r - w)} A${r - w},${r - w} 0 ${large} 0 ${p(s, r - w)} Z`;
  });
  const shown = hover === null ? null : items[hover];
  return (
    <div className="donut">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {arcs.map((d, i) => (
          <path key={items[i].label} d={d} fill={items[i].color} opacity={hover === null || hover === i ? 1 : 0.4} onMouseEnter={() => setHover(i)} style={{ transition: 'opacity 0.15s' }} />
        ))}
        <text x={c} y={c - 4} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: 'var(--ink)' }}>
          {format(shown ? shown.value : total)}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" style={{ fontSize: 11.5, fill: 'var(--muted)' }}>
          {shown ? shown.label : centerLabel}
        </text>
      </svg>
      <ul className="donut-legend">
        {items.map((it, i) => (
          <li key={it.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: it.color }} />
            <span className="l">{it.label}</span>
            <span className="v">{format(it.value)}</span>
            <span className="p">{Math.round((it.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Funnel ---------- */

export function Funnel({ steps }: { steps: { label: string; value: number; color: string; ink?: string }[] }) {
  const top = steps[0].value;
  return (
    <div className="funnel">
      {steps.map((s, i) => (
        <div className="funnel-row" key={s.label} title={`${s.label}: ${s.value.toLocaleString()}`}>
          <span className="funnel-label">{s.label}</span>
          <span className="funnel-track">
            <span className="funnel-bar" style={{ width: `${Math.max(6, (s.value / top) * 100)}%`, background: s.color, color: s.ink ?? '#fff' }}>
              {s.value.toLocaleString()}
            </span>
          </span>
          <span className="funnel-conv">{i === 0 ? '' : `${Math.round((s.value / steps[i - 1].value) * 100)}%`}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Sparkline ---------- */

export function Sparkline({ values, color, width = 120, height = 36 }: { values: number[]; color: string; width?: number; height?: number }) {
  const gid = useId().replace(/:/g, '');
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sx = (i: number) => 2 + (i / (values.length - 1)) * (width - 4);
  const sy = (v: number) => height - 3 - ((v - min) / (max - min || 1)) * (height - 8);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(v)}`).join('');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${sx(values.length - 1)},${height} L${sx(0)},${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(values.length - 1)} cy={sy(values[values.length - 1])} r={3} fill={color} />
    </svg>
  );
}
