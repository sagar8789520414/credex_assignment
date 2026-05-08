# DEVLOG

## Day 1 — 2026-05-01
**Hours worked:** 4
**What I did:** Read the assignment brief carefully. Set up the Vite + React + TypeScript project, configured Tailwind v4, shadcn/ui primitives (Button, Card, Input, Label, Select, Badge). Scaffolded the SpendForm component with all 8 required tools and their plans. Verified pricing data against official pages for Cursor, GitHub Copilot, Claude, ChatGPT.
**What I learned:** Tailwind v4 uses a Vite plugin instead of PostCSS — the setup is cleaner but the docs are sparse. Had to read the changelog to get it working.
**Blockers / what I'm stuck on:** Radix Select doesn't show a placeholder when value is an empty string — need to ensure default tool state always has a valid toolId.
**Plan for tomorrow:** Build the audit engine with per-tool rules, wire up the results page, get the full form → results flow working end-to-end.

## Day 2 — 2026-05-02
**Hours worked:** 5
**What I did:** Built the full audit engine (`auditEngine.ts`) with per-tool auditors for all 8 tools. Implemented plan overkill detection, use-case mismatch detection, and overlap detection for multiple coding IDEs. Built the AuditResults page with the hero savings card, per-tool breakdown, and Credex CTA for high-savings cases. Wired up localStorage persistence for form state and audit results.
**What I learned:** The audit logic needs to be defensible to a finance person — I spent more time on the reasoning strings than the math. "Cursor bad" is not a reason; "Business plan adds SSO for a 2-person team that doesn't need it" is.
**Blockers / what I'm stuck on:** The `officialMonthlySpend` helper was overriding user-entered spend with plan price × seats. This means a user who enters $300 for Cursor Pro gets told they save $280 when the math is actually based on $20/seat. Need to fix this.
**Plan for tomorrow:** Fix the spend calculation bug, add Supabase backend for lead storage, integrate Resend for transactional email.

## Day 3 — 2026-05-03
**Hours worked:** 6
**What I did:** Fixed the critical spend calculation bug — `currentSpend` now always comes from `entry.monthlySpend` (user input), never recalculated from plan price. Added the Express backend server with `/api/leads` route, Supabase integration, and Resend email. Set up the `load-env.cjs` preloader to fix env var loading. Debugged the `.env` file encoding issue (file was 0 bytes on disk despite showing content in editor).
**What I learned:** `dotenv` v17 is actually `dotenvx` with different logging behavior. The `◇ injected env (0)` message means vars were already set, not that loading failed. Always verify with `node -e "console.log(process.env.SUPABASE_URL)"` rather than trusting the log.
**Blockers / what I'm stuck on:** Resend API key is "send-only" — can't call `/domains` endpoint. Not a blocker since we only need to send emails.
**Plan for tomorrow:** Build the shareable URL feature, add OG meta tags, write tests.

## Day 4 — 2026-05-04
**Hours worked:** 5
**What I did:** Built the full share feature — `POST /api/audits` saves to Supabase, `GET /api/audits/:id` fetches for cross-device share links. Built `SharedResult.tsx` with anonymized public view (no email/company). Added dynamic OG tags via Express `/og/share/:id` route that detects crawlers and injects `"We found $X in annual AI savings"` meta tags. Added Toast component for "Link copied" feedback.
**What I learned:** React SPA can't do dynamic OG tags — crawlers don't run JavaScript. The Express server-side OG route is the right pattern for a Vite SPA. Bots get the HTML shell with meta tags; browsers get redirected to the SPA.
**Blockers / what I'm stuck on:** The `audits` table didn't exist in Supabase — had to create it manually via SQL editor. The `setup-db.ts` script uses `rpc('exec_sql')` which isn't available on the free tier.
**Plan for tomorrow:** Run Lighthouse, fix accessibility issues, write the entrepreneurial docs (GTM, ECONOMICS, USER_INTERVIEWS).

## Day 5 — 2026-05-05
**Hours worked:** 5
**What I did:** Ran Lighthouse against the production build — scored 97/87/100/91. Fixed all failing audits: heading order (h3 without h2), color contrast (emerald-600 fails 4.5:1 on white, switched to emerald-700), button aria-labels on Radix Select triggers, added `robots.txt`. Added code splitting via `manualChunks` in vite.config.ts — main bundle dropped from 377KB to 72KB. Final scores: 98/100/100/100.
**What I learned:** Radix Select triggers need explicit `aria-label` because the combobox role doesn't inherit the label from the adjacent `<Label>` element. The `htmlFor` → `id` link works for native inputs but not for Radix primitives.
**Blockers / what I'm stuck on:** `manualChunks` as an object is deprecated in Vite 8 — must use function form. Caught this from the TypeScript error.
**Plan for tomorrow:** Conduct user interviews, write GTM/ECONOMICS/USER_INTERVIEWS docs, fix form state persistence bug.

## Day 6 — 2026-05-06
**Hours worked:** 6
**What I did:** Conducted 3 user interviews (founders/CTOs from my network). Wrote GTM.md, ECONOMICS.md, USER_INTERVIEWS.md, LANDING_COPY.md, METRICS.md. Fixed the form state persistence bug — the "Edit inputs" button now correctly restores form state using React Router `state` to distinguish navigation-back from fresh page loads. Fixed the Radix Select blank dropdown bug by adding `sanitizeTools()` to validate toolId/plan on load. Did a full end-to-end test of all 6 MVP features: form submission, audit engine output, results page hero, lead capture modal (email + Supabase insert + Resend email confirmed in inbox), share link working cross-device via Supabase, and OG meta tags verified with a crawler user-agent test. All 6 features working correctly.
**What I learned:** The most surprising interview finding: one CTO didn't know their Cursor Business plan had a 5-seat minimum — they were paying for 5 seats but only had 3 devs. This validated the seat overkill detection feature directly.
**Blockers / what I'm stuck on:** Nothing blocking. All MVP features confirmed working end-to-end.
**Plan for tomorrow:** Push to GitHub, deploy to Vercel/Render, write REFLECTION.md, submit the assignment.

## Day 7 — 2026-05-08
**Hours worked:** 5
**What I did:** Initialised the public GitHub repo, wrote meaningful conventional commit messages for the full history, pushed all code. Verified `.env` is in `.gitignore` and no secrets are in the repo. Deployed the frontend to Vercel — set `VITE_ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard. Deployed the Express backend to Render as a Node.js web service with all non-`VITE_` env vars set. Confirmed the live URL is reachable, the share link works cross-device, and the lead capture email arrives. Ran the CI workflow on the pushed commit — lint, tests (8/8 passing), and build all green. Took 3 screenshots of the app (form, results page, shared result) and added them to README.md. Submitted the Google Form with the GitHub repo URL, live deployed URL, and all required files confirmed present.

**CI Workflow Issues & Fixes:**
After the initial push, the GitHub Actions workflow flagged 10 lint errors and warnings. Fixed all of them:
1. **setState in Effect** — `AISummary.tsx` and `AuditResults.tsx` had synchronous setState calls in effect bodies. Wrapped state updates in async functions with `cancelled` flag checks to prevent cascading renders.
2. **Missing Dependency** — Changed `audit.id` to `audit` in the dependency array of `AISummary.tsx` to properly track all dependencies.
3. **Non-Component Exports** — Extracted `badgeVariants` and `buttonVariants` into separate files (`badge-variants.ts`, `button-variants.ts`) so component files only export React components (required by `react-refresh` rule).
4. **Unused Variables** — Added explanatory comments for unused parameters (`_teamSize`, `_useCase` in API auditors; `_` in catch blocks; `email` in email builder) to document why they exist.
5. **Empty Blocks** — Added comments inside empty catch blocks in `storage.ts`.
6. **Empty Interface** — Removed unused `InputProps` interface from `input.tsx` and inlined the type.
7. **TypeScript Build Error** — Added non-null assertion (`id!`) in `AuditResults.tsx` after the `if (!id) return;` guard.
8. **Duplicate Validation** — Removed duplicate email regex check in `server/routes/leads.ts`.

Final result: All CI checks pass — 0 lint errors, 8/8 tests passing, build successful.

**What I learned:** Vercel's environment variable UI doesn't expose `VITE_` prefixed vars to the browser by default — you have to mark them as "exposed to browser" or they come through as `undefined`. Caught this during the post-deploy smoke test when the Anthropic summary wasn't loading. ESLint rules like `react-hooks/set-state-in-effect` and `react-refresh/only-export-components` exist for good reasons — they catch real performance and tooling issues.
**Blockers / what I'm stuck on:** None. Submission complete with all CI checks passing.
**Plan for tomorrow:** N/A — assignment submitted.
