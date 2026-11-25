/** Synthetic account signals, as a research tool would surface them. All fictional. */
import type { Deal } from '../data/deals';

export interface Signal {
  date: string;
  type: 'Leadership' | 'Hiring' | 'Funding' | 'Contract' | 'Technology' | 'News';
  text: string;
}

const SPECIFIC: Record<string, Signal[]> = {
  harborview: [
    { date: '2026-11-04', type: 'Contract', text: 'Renewed its Stratus Cloud enterprise agreement with a larger 3-year commit; $820K remains unused this fiscal year.' },
    { date: '2026-10-18', type: 'Leadership', text: 'New CFO announced a freeze on adding new vendors until Q2, "except through existing cloud agreements".' },
    { date: '2026-09-30', type: 'Hiring', text: 'Posted 4 revenue-management data roles mentioning dynamic pricing and forecasting.' },
  ],
  cobalt: [
    { date: '2026-11-10', type: 'Technology', text: 'Keystone Digital press release: phase 2 of Cobalt’s Ledgerline ERP upgrade starts in January.' },
    { date: '2026-10-22', type: 'News', text: 'Q3 earnings call: CFO cites "margin visibility by store" as the top 2027 priority.' },
    { date: '2026-10-02', type: 'Hiring', text: 'Hiring a Director of Merchandising Analytics, reporting to the VP who is our champion.' },
  ],
  delmar: [
    { date: '2026-11-12', type: 'News', text: 'Regional health regulator published new guidance on third-party data processors, effective March 2027.' },
    { date: '2026-10-28', type: 'Leadership', text: 'Appointed a new Chief Information Security Officer from a national health service.' },
    { date: '2026-10-05', type: 'Contract', text: 'Halden & Rowe began a data-governance advisory engagement with Delmar’s executive team.' },
  ],
};

export function signalsFor(deal: Deal): Signal[] {
  return (
    SPECIFIC[deal.id] ?? [
      { date: '2026-10-15', type: 'Hiring', text: `${deal.account} is hiring data and analytics roles in ${deal.region}.` },
      { date: '2026-09-20', type: 'News', text: `${deal.account} named data modernization a 2027 priority in its latest update.` },
    ]
  );
}
