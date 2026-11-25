import { useState } from 'react';
import '../case-study.css';

type Area = 'Co-sell' | 'Channel' | 'Alliances';

interface UseCase {
  area: Area;
  who: string;
  title: string;
  problem: string;
  agents: string;
  newSkill: string;
  metric: string;
  live?: boolean;
}

const CASES: UseCase[] = [
  {
    area: 'Co-sell', who: 'Software vendor + cloud marketplace', live: true,
    title: 'Close deals through a cloud marketplace',
    problem: 'A customer froze new vendors but has unused cloud commit. A marketplace private offer turns a 90-day procurement into days.',
    agents: 'Strategist, Researcher, Matcher, Negotiator, Deal Desk, Writer, cloud partner agent',
    newSkill: 'None: running in the demo (Harborview Hotels)',
    metric: 'Win rate and days to close',
  },
  {
    area: 'Co-sell', who: 'Software vendor + integrator', live: true,
    title: 'Unblock a deal that needs integration on day one',
    problem: 'The CFO will only sign if ERP data flows in at launch, and the customer has no team to build it.',
    agents: 'Same team; the integrator’s agent confirms it is already on site',
    newSkill: 'None: running in the demo (Cobalt Retail Group)',
    metric: 'Late-stage deals rescued',
  },
  {
    area: 'Co-sell', who: 'Software vendor + advisory firm', live: true,
    title: 'Get through security and compliance review',
    problem: 'Deals stall for weeks in risk review. A partner with pre-approved controls or regulator relationships shortens it.',
    agents: 'Same team; the advisory partner’s agent confirms capacity and terms',
    newSkill: 'None: running in the demo (Delmar Health)',
    metric: 'Days in security review',
  },
  {
    area: 'Channel', who: 'Vendor with resellers',
    title: 'Resolve deal-registration conflicts',
    problem: 'Two resellers register the same deal. Rules are applied by hand, slowly, and partners feel treated unfairly.',
    agents: 'Matcher, Negotiator, Deal Desk, plus reseller agents via A2A',
    newSkill: 'deal-registration: eligibility, conflict, and protection rules',
    metric: 'Time to approve a registration',
  },
  {
    area: 'Channel', who: 'Vendor and reseller network',
    title: 'Issue marketplace private offers through resellers',
    problem: 'Reseller-led private offers need terms agreed by three parties: vendor, reseller, and cloud marketplace.',
    agents: 'Deal Desk, Negotiator, cloud and reseller agents via A2A',
    newSkill: 'private-offer-terms: margins, discounts, and approvals',
    metric: 'Days from quote to signed offer',
  },
  {
    area: 'Alliances', who: 'Strategic alliance team',
    title: 'Find accounts partners already own',
    problem: 'Account mapping means sharing CRM exports. Agents can compare overlap without either side handing over its list.',
    agents: 'Researcher, Matcher, Negotiator, partner agents via A2A',
    newSkill: 'account-mapping: privacy-preserving overlap and prioritization',
    metric: 'Partner-sourced pipeline',
  },
  {
    area: 'Alliances', who: 'Partner marketing',
    title: 'Allocate marketing development funds',
    problem: 'Co-marketing budget goes to the loudest partners, not the ones whose customers convert.',
    agents: 'Matcher, Deal Desk, Writer',
    newSkill: 'mdf-allocation: fund requests scored on expected pipeline',
    metric: 'Pipeline per MDF dollar',
  },
  {
    area: 'Co-sell', who: 'Customer success',
    title: 'Save at-risk renewals with the partner on site',
    problem: 'The partner running the customer’s project often sees churn risk first, but nobody asks them.',
    agents: 'Researcher, Matcher, Negotiator, Writer',
    newSkill: 'renewal-risk: signals, partner check-in protocol',
    metric: 'Retention on partner-attached accounts',
  },
  {
    area: 'Alliances', who: 'Partner program team',
    title: 'Onboard and certify new partners',
    problem: 'New partners take months to co-sell their first deal: training, certification, and the first introduction are all manual.',
    agents: 'New onboarding agent, with Matcher finding their first fitting deal',
    newSkill: 'partner-onboarding: certification path and first-deal matching',
    metric: 'Time to first co-sold deal',
  },
];

const TONE: Record<Area, string> = { 'Co-sell': '#4f46e5', Channel: '#9333ea', Alliances: '#c026d3' };

export function UseCasesView() {
  const [area, setArea] = useState<Area | 'All'>('All');
  const shown = CASES.filter((c) => area === 'All' || c.area === area);
  return (
    <div className="cs">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1>Use cases</h1>
          <p>
            The same agents, playbooks, and agent-to-agent model cover most of what a partner organization does. New use cases reuse the team and add
            one new skill.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Filter use cases">
          {(['All', 'Co-sell', 'Channel', 'Alliances'] as const).map((a) => (
            <button key={a} aria-pressed={area === a} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="uc-grid">
        {shown.map((c) => (
          <article className="uc" key={c.title} style={{ ['--tone' as string]: TONE[c.area] }}>
            <div className="uc-top">
              <div className="uc-who">
                {c.area} · {c.who}
              </div>
              <h3>{c.title}</h3>
              <p>{c.problem}</p>
            </div>
            <div className="uc-body">
              <div className="uc-row">
                <span className="l">Agents</span>
                <span>{c.agents}</span>
              </div>
              <div className="uc-row">
                <span className="l">New skill</span>
                <span>{c.newSkill}</span>
              </div>
            </div>
            <div className="uc-foot">
              <span className="uc-metric">Moves: {c.metric}</span>
              {c.live ? (
                <a className="uc-badge live" href="#/agents">
                  Live in demo →
                </a>
              ) : (
                <span className="uc-badge next">Next</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
