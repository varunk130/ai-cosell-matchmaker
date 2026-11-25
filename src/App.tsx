import { useCallback, useEffect, useState } from 'react';
import { PipelineView } from './views/PipelineView';
import { DealView } from './views/DealView';
import { PartnersView } from './views/PartnersView';
import { ImpactView } from './views/ImpactView';
import { MissionView } from './views/MissionView';
import { CaseStudyView } from './views/CaseStudyView';
import { UseCasesView } from './views/UseCasesView';
import { IconCheck, IconImpact, IconPartners, IconPipeline, IconSparkle } from './components/icons';

export type CoSellStatus = 'none' | 'drafted' | 'requested';

const STORE_KEY = 'partnerfit.status.v1';

function loadStatus(): Record<string, CoSellStatus> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

const NAV = [
  { href: '#/', key: '', label: 'Case study', Icon: IconImpact },
  { href: '#/agents', key: 'agents', label: 'Agent network', Icon: IconSparkle },
  { href: '#/use-cases', key: 'use-cases', label: 'Use cases', Icon: IconCheck },
  { href: '#/pipeline', key: 'pipeline', label: 'Pipeline', Icon: IconPipeline },
  { href: '#/partners', key: 'partners', label: 'Partners', Icon: IconPartners },
  { href: '#/impact', key: 'impact', label: 'Impact', Icon: IconImpact },
];

export function App() {
  const route = useRoute();
  const [status, setStatusMap] = useState<Record<string, CoSellStatus>>(loadStatus);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(status));
    } catch {
      /* storage unavailable: state just won't persist */
    }
  }, [status]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const section = route[0] === 'deal' ? 'pipeline' : (route[0] ?? '');

  let view;
  if (route[0] === 'deal' && route[1]) {
    const id = route[1];
    view = <DealView key={id} id={id} status={status[id] ?? 'none'} setStatus={(s) => setStatusMap((m) => ({ ...m, [id]: s }))} toast={toast} />;
  } else if (route[0] === 'pipeline') view = <PipelineView status={status} />;
  else if (route[0] === 'partners') view = <PartnersView />;
  else if (route[0] === 'impact') view = <ImpactView />;
  else if (route[0] === 'agents') view = <MissionView />;
  else if (route[0] === 'use-cases') view = <UseCasesView />;
  else view = <CaseStudyView />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="mark">PF</span>
          <span>
            PartnerFit
            <small>Northwind Analytics</small>
          </span>
        </div>
        <nav className="nav">
          {NAV.map(({ href, key, label, Icon }) => (
            <a key={label} href={href} aria-current={section === key ? 'page' : undefined}>
              <Icon /> {label}
            </a>
          ))}
        </nav>
        <div className="foot">
          <strong>Demo data.</strong> All companies, people, and numbers are fictional. Runs offline.
        </div>
      </aside>
      <main className="main">{view}</main>
      {toastMsg && (
        <div className="toast" role="status">
          <IconCheck width={16} height={16} /> {toastMsg}
        </div>
      )}
    </div>
  );
}
