# Reflection

## 1. The hardest bug

The hardest bug was in the overlap detection logic. My first implementation flagged any two tools from the set `[cursor, github_copilot, windsurf]` as overlapping — including cases where one was on the free/hobby plan. A user on Cursor Hobby + Copilot Individual isn't double-paying; they're just exploring. The bug manifested as a false positive warning that said "you're paying for multiple coding AI tools" when the user had $0 spend on one of them.

My first hypothesis was that the `officialMonthlySpend` function was returning a non-zero value for free plans. I added a console.log and confirmed it was returning 0 correctly. So the bug was upstream — in the overlap detection filter itself. I was filtering on `plan !== 'free'` but forgot to also exclude `plan !== 'hobby'` (Cursor's free tier is called "hobby", not "free"). Once I saw that, the fix was a one-line change: `e.plan !== 'free' && e.plan !== 'hobby'`. The lesson: when writing rule-based logic, enumerate the edge cases explicitly rather than assuming a general condition covers them.

## 2. A decision I reversed

I initially planned to call the Anthropic API through the Express backend server — the standard secure pattern. The frontend would POST the audit data to `/api/summary`, the server would call Anthropic, and return the text. This is the right architecture for production.

I reversed this on Day 3 when I realised it added a round-trip dependency: the AI summary wouldn't render until the backend was running, which complicated local development and the Vercel deployment (which would need a separate backend service). For a free tool where the API key has no billing risk beyond my own account, calling Anthropic directly from the browser with the `anthropic-dangerous-direct-browser-access` header is an acceptable tradeoff. I documented this in ARCHITECTURE.md and noted the production fix (proxy through server). The reversal was driven by shipping speed vs. security purity — and for a week-1 MVP, shipping wins.

## 3. What I'd build in week 2

The single highest-value week-2 addition is a **benchmark mode**: "your AI spend per developer is $X — companies your size average $Y." This requires collecting aggregate data from submitted audits (anonymised) and computing percentiles by team size and use case. It transforms the tool from "here's what you could save" to "here's how you compare" — a much stronger hook for sharing and for the Credex sales conversation.

Second priority: move the Anthropic API call to the server-side proxy, add Redis caching for summaries (same audit inputs → same summary, no repeat API calls), and add a proper Supabase schema with audit storage (not just leads). This enables a "view past audits" feature and gives Credex a richer dataset for outreach.

Third: PDF export. The results page is designed to be screenshotted, but a one-click PDF with the Credex logo is a better leave-behind for the sales conversation.

## 4. How I used AI tools

I used Claude (Sonnet) throughout the week for three categories of tasks:

- **Boilerplate generation:** Radix UI component wrappers (Select, Label, Badge) — these are mechanical and well-documented. I reviewed every line but didn't write them from scratch.
- **Copy editing:** The email template HTML and the fallback summary template. I wrote the first draft, Claude tightened the prose.
- **Rubber ducking:** When I was stuck on the overlap detection bug, I described the problem to Claude and it immediately suggested checking the plan name filter. It was right.

What I didn't trust AI with: the audit logic itself. The per-tool auditors in `auditEngine.ts` are entirely hand-written because the reasoning has to be defensible to a finance person. An LLM would produce plausible-sounding but potentially wrong recommendations (e.g., recommending a plan that doesn't exist, or getting the seat minimums wrong). I verified every pricing number against official pages myself.

One specific time the AI was wrong: I asked Claude to confirm the ChatGPT Team plan minimum seat count. It said "no minimum." The actual minimum is 2 seats. I caught this by checking the OpenAI pricing page directly. This is exactly the kind of factual error that would undermine the tool's credibility if it made it into the audit logic.

## 5. Self-ratings

- **Discipline: 8/10** — I started on Day 1 and committed every day. I could have started the user interviews earlier (Day 5 instead of Day 6).
- **Code quality: 7/10** — The audit engine is clean and well-tested. The React components are functional but could benefit from more decomposition (AuditResults.tsx is doing too much).
- **Design sense: 7/10** — The UI is clean and functional. The hero savings card is visually strong. I didn't invest in custom illustrations or micro-animations that would push it to 9/10.
- **Problem-solving: 8/10** — The overlap detection bug was caught and fixed quickly. The Anthropic API architecture decision was made deliberately with tradeoffs documented.
- **Entrepreneurial thinking: 8/10** — The GTM plan is specific and realistic. The economics math is honest. The user interviews changed a real design decision. I treated this as a product, not a coding exercise.
