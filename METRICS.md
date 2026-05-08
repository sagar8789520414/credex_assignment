# Metrics

## North Star metric

**Qualified leads generated per week** — defined as email captures from audits showing ≥$200/month in savings.

Why: This is the metric that directly drives Credex revenue. A high audit completion rate with no email captures is vanity. A high email capture rate from low-savings audits is noise. The North Star filters for users who have a real problem Credex can solve.

## 3 input metrics

1. **Audit completion rate** (audits completed ÷ form page visits)
   - Target: ≥30%
   - Drives the North Star by determining how many users reach the results page
   - If this drops below 20%, the form is too long or confusing

2. **High-savings rate** (audits showing ≥$200/mo savings ÷ total audits)
   - Target: ≥40%
   - Drives the North Star by determining what fraction of completers are qualified leads
   - If this drops, either the tool is attracting already-optimised users or the audit logic is too conservative

3. **Email capture rate** (email captures ÷ audits showing ≥$200/mo savings)
   - Target: ≥25%
   - Drives the North Star directly
   - If this drops, the results page isn't building enough trust or the CTA copy is weak

## What to instrument first

1. Page view events on `/` (form), `/results/:id` (results), `/share/:id` (shared)
2. Form submission event (audit run)
3. Email capture event (lead submitted) with savings amount as a property
4. Share button click event
5. Credex CTA click event (for high-savings cases)

Use PostHog (free tier) — it captures all of the above with one `posthog.capture()` call and provides funnel analysis out of the box.

## Pivot trigger

If after 4 weeks of active distribution:
- Fewer than 100 audits completed, OR
- Email capture rate below 10%, OR
- Zero Credex consultation bookings

Then the hypothesis that "startups don't know they're overspending" is wrong for this audience, and we need to either change the distribution channel (the tool is reaching the wrong people) or change the product (the audit isn't surfacing real savings).

The first thing to test in a pivot: show the audit results without requiring any form input — just a single "what's your team size?" question — to reduce friction and test whether completion rate improves.
