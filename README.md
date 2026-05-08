# SpendLens — AI Spend Audit

SpendLens is a free web tool that audits your team's AI tool subscriptions and surfaces where you're overpaying — with specific, finance-literate recommendations. It's a lead-generation asset for [Credex](https://credex.rocks), which sells discounted AI credits to startups.

**Who it's for:** Startup founders, CTOs, and engineering managers who pay for AI tools and have no benchmark for whether they're spending well.

## Live URL

[https://spendlens.app](https://spendlens.app) *(deploy your own — see below)*

## Screenshots

> Add 3+ screenshots or a Loom link here after deployment.

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/your-username/ai-spend-audit
cd ai-spend-audit
npm install

# 2. Set environment variables
cp .env.example .env
# Fill in VITE_ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY

# 3. Run frontend
npm run dev

# 4. Run backend (separate terminal)
npm run server:dev
```

## Deploy

**Frontend (Vercel):**
```bash
npx vercel --prod
```
Set `VITE_ANTHROPIC_API_KEY` in Vercel environment variables.

**Backend (Render / Fly.io):**
Deploy `server/index.ts` as a Node.js service. Set all non-`VITE_` env vars.

## Run tests

```bash
npm test
```

## Decisions

1. **React + Vite over Next.js** — The app is a pure SPA with no SEO-critical pages. Vite's build speed and simplicity outweigh Next.js's SSR benefits here. Open Graph tags are static and don't need server rendering.

2. **Hardcoded audit rules over AI** — The audit math is deterministic and finance-literate. Using an LLM for pricing logic would introduce hallucination risk and latency. AI is used only for the personalised summary paragraph, where creativity adds value.

3. **localStorage for audit persistence** — Avoids requiring a backend for the core audit flow. Users can share results via URL without an account. The tradeoff is audits are device-local, but that's acceptable for a free tool.

4. **Supabase for lead storage** — Free tier covers the expected volume, has a good TypeScript SDK, and requires no infrastructure management. The tradeoff vs. a simple Postgres on Render is slightly less control, but faster to ship.

5. **Resend for transactional email** — 100 emails/day free, excellent deliverability, and a clean API. The tradeoff vs. SES is slightly higher cost at scale, but SES requires domain verification complexity that slows down the first week.
