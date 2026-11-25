# Talk track: PartnerFit (about 7 minutes)

**Setup before you present:** `npm run dev`, open the app, stay on **Case study**. In the Agent network tab, select **Win Harborview Hotels** and **1x** speed.

---

## Part 1: The story (2–4 min, Case study page)

**Open (hero, 30s)**
> "In B2B, the right partner can nearly double a deal's odds. But finding that partner and getting them engaged is days of email between two companies. I built a network of AI agents that does it in one run."

Point to the four hero numbers: **$85B** marketplace market, **21% → 41%** win rate, **+$1.32M** expected lift, **6 + 8** agents.

**Problem (section 1, 30s)**
> "Three things go wrong today: partners get picked by territory instead of by what's blocking the deal; confirming fit, capacity, and terms crosses company lines; and sellers miss money sitting in a customer's unused cloud commit."

**Opportunity (section 2, 45s)**
> "Canalys forecasts software sold through cloud marketplaces goes from $16B to $85B by 2028, and more than half of it through partners. That's about $43B of co-sell. The first slice I'd go after, about $4B, is deals blocked by procurement, integration, or security, where the right partner is the unlock. That last number is my assumption; the others are cited at the bottom."

**Why now (section 3, 20s)**
> "Marketplaces are scaling five times over, companies are starting to expose their own agents, and skills make expert playbooks portable."

**How it works + the AI team (sections 4–5, 60s)**
> "Six specialists, each with one job, one skill, and only the tools that job needs. The interesting step is four: my negotiator agent talks directly to the partner company's own agent. Each side keeps its own data. My side only shares a deal-size band, never the contract value, and a test enforces that."
> "A skill is just an expert's playbook in a short file. Agents see a one-line summary and load the full playbook only when they need it. The business can edit it in plain text."

Transition: *"Let me show you."* Click **▶ Watch the agents work a deal**.

---

## Part 2: Live demo (2 min, Agent network page)

Click **▶ Run mission**. Narrate as the trace fills:

1. **Deal Strategist** loads its playbook and reads the deal. *"The main blocker is a 90-day new-vendor process."*
2. **Account Researcher**: *"It finds the CFO froze new vendors, except through existing cloud agreements. That's the clue."*
3. **Partner Matcher**: *"Stratus Cloud scores 69: the customer has $820K of unused Stratus commit, enough to cover this deal twice."*
4. **A2A boxes** (orange): *"Here my agent crosses into another company. Stratus's own agent checks its CRM and capacity and answers 'Committed'."*
5. **Deal Desk**: *"It compares a marketplace private offer with a referral fee on expected value."*
6. **Plan Writer** saves two deliverables.

Point at the left panel as agents turn green, and the stats row (skills loaded, tool calls, A2A messages).

---

## Part 3: Outcome and artifact (1 min)

When the **Mission complete** banner appears:
> "In one run: partner chosen, win probability from 21% to 45%, expected value up $77K for a $10K partner fee, and two partners contacted agent to agent."

Click **Read the co-sell plan ↓**. Scroll the plan: summary, research, why this partner, partner responses table, terms, risks, next steps with owners. Click the **Intro to Stratus Cloud** tab: *"And the intro email, ready for the seller to review and send."*

Close:
> "Every number came from a tool, and every step is in the trace. Add an API key and the same agents run on Claude instead of the scripted replay."


## Optional: Use cases (30s, Use cases tab)

> "The demo shows a few missions, but the same agents cover much more. Each card here reuses the existing team and adds one new playbook. The ones marked Live in demo are what you just saw."

---

## Likely questions

- **Is this real AI?** Replay mode scripts the decisions so it runs offline for anyone; the tools, data, and outputs are real. Live mode runs the same agents on Claude with tool use.
- **Why agent-to-agent instead of an API?** Each company keeps control of its data and policy; its agent decides what to share. An API would need both sides to agree on a schema upfront.
- **What would you measure in a pilot?** Win rate and cycle time on matched vs. unmatched deals, and time from deal to partner engagement.
- **Where are the numbers from?** Market sizes are cited (Canalys, Forrester). Deal and win-rate figures are synthetic demo data.
