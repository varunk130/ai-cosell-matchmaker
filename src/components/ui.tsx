import { useEffect, type ReactNode } from 'react';
import type { Partner, PartnerType } from '../data/partners';
import type { Stage } from '../data/deals';

const TYPE_COLOR: Record<PartnerType, string> = {
  'Cloud marketplace': '#2a78d6',
  'Systems integrator': '#d4592a',
  'Software partner': '#6250d6',
};

export function Avatar({ partner, size }: { partner: Partner; size?: 'lg' }) {
  return (
    <span className={`avatar${size ? ' ' + size : ''}`} style={{ background: TYPE_COLOR[partner.type] }} aria-hidden="true">
      {partner.initials}
    </span>
  );
}

export function PartnerName({ partner, sub }: { partner: Partner; sub?: ReactNode }) {
  return (
    <span className="who">
      <Avatar partner={partner} />
      <span style={{ minWidth: 0 }}>
        <span className="cell-title" style={{ display: 'block' }}>{partner.name}</span>
        <span className="cell-sub">{sub ?? partner.type}</span>
      </span>
    </span>
  );
}

export function ScorePill({ score, recommended }: { score: number; recommended: boolean }) {
  const cls = !recommended ? '' : score >= 70 ? 'good' : 'accent';
  return (
    <span className={`pill ${cls}`}>
      <span className="score">{score}</span> fit
    </span>
  );
}

const STAGE_CLASS: Record<Stage, string> = { Discovery: '', Evaluation: '', Proposal: 'accent', Negotiation: 'good' };
export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span className={`pill ${STAGE_CLASS[stage]}`}>
      <span className="dot" />
      {stage}
    </span>
  );
}

/** Circular 0-100 gauge for the headline match score. */
export function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`Fit score ${score} out of 100`} style={{ flex: 'none' }}>
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 34 34)" />
      <text x="34" y="40" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--ink)' }}>
        {score}
      </text>
    </svg>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function BarList({ data, format }: { data: { label: ReactNode; value: number; title: string }[]; format: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1e-9);
  return (
    <div className="bars" role="list">
      {data.map((d) => (
        <div className="bar-row" key={d.title} role="listitem" title={d.title}>
          <span className="small ink2">{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="val">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="card-head">
          <h2>{title}</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="card-pad">{children}</div>
        <div className="foot">{footer}</div>
      </div>
    </div>
  );
}

export const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`;
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const shortDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
