import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

// GET /share/:id — serve dynamic OG meta tags for crawlers, SPA for browsers
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';

  // Only inject OG tags for crawlers (bots don't run JS)
  const ua = req.headers['user-agent'] ?? '';
  const isCrawler = /bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|linkedinbot|whatsapp|telegram|discord/i.test(ua);

  if (!isCrawler) {
    // Regular browser — redirect to the SPA route
    return res.redirect(`${appUrl}/share/${id}`);
  }

  // Fetch audit data for OG tags
  let title = 'SpendLens — AI Spend Audit';
  let description = 'See how much this team could save on AI tools. Run your own free audit.';

  try {
    const { data } = await supabase
      .from('audits')
      .select('data')
      .eq('id', id)
      .single();

    if (data?.data) {
      const audit = data.data as { totalMonthlySavings: number; totalAnnualSavings: number; teamSize: number };
      const annual = Math.round(audit.totalAnnualSavings);
      const monthly = Math.round(audit.totalMonthlySavings);

      if (annual > 0) {
        title = `We found $${annual.toLocaleString()} in annual AI savings on SpendLens!`;
        description = `A ${audit.teamSize}-person team could save $${monthly.toLocaleString()}/mo ($${annual.toLocaleString()}/yr) by optimising their AI tool stack. See the full breakdown.`;
      } else {
        title = 'This team\'s AI spend is already optimised — SpendLens';
        description = 'No savings found — their AI stack is well-matched to their team size and use case. Run your own free audit.';
      }
    }
  } catch {
    // Fall through to defaults
  }

  const shareUrl = `${appUrl}/share/${id}`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:site_name" content="SpendLens" />
  <meta property="og:image" content="${appUrl}/og-image.png" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${appUrl}/og-image.png" />

  <!-- Redirect browsers that land here directly -->
  <meta http-equiv="refresh" content="0;url=${shareUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${shareUrl}">${shareUrl}</a>…</p>
</body>
</html>`);
});

export default router;
