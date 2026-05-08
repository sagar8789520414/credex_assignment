import { Router, Request, Response } from 'express';
import { Resend } from 'resend';
import { supabase } from '../db';

const router = Router();

// Lazy-init Resend so missing key doesn't crash the server
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface LeadBody {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
}

router.post('/', async (req: Request, res: Response) => {
  const { email, companyName, role, teamSize, auditId } = req.body as LeadBody;

  console.log('[leads] POST /api/leads', { email, auditId });

  if (!email || !auditId) {
    console.warn('[leads] Missing required fields:', { email: !!email, auditId: !!auditId });
    return res.status(400).json({ error: 'email and auditId are required' });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn('[leads] Invalid email format:', email);
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Store in Supabase
    const { error: dbError } = await supabase.from('leads').insert({
      email,
      company_name: companyName ?? null,
      role: role ?? null,
      team_size: teamSize ?? null,
      audit_id: auditId,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('[leads] DB error:', dbError.message);
      // Don't fail the request — still send the email
    }

    // Send confirmation email — non-fatal if it fails
    if (process.env.RESEND_API_KEY) {
      const resend = getResend();
      if (resend) {
        try {
          const emailResult = await resend.emails.send({
            from: 'SpendLens <onboarding@resend.dev>',
            to: email,
            subject: 'Your AI Spend Audit Report',
            html: buildEmailHtml({ email, companyName, auditId }),
          });
          console.log('[leads] Email sent:', emailResult?.data?.id ?? 'ok');
        } catch (emailErr: unknown) {
          // Log but don't fail the submission — DB record is already saved
          console.error('[leads] Email error:', emailErr instanceof Error ? emailErr.message : emailErr);
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('[leads] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function buildEmailHtml({ companyName, auditId }: Partial<LeadBody>): string {
  // Note: email is not used in email template — it's passed to resend.emails.send() instead
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.warn('[email] APP_URL not set — using fallback. Email links may not work in production.');
  }
  const shareUrl = `${appUrl ?? 'https://spendlens.app'}/share/${auditId}`;
  console.log('[email] Generated share URL:', { shareUrl, appUrlSet: !!appUrl });
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #059669; font-size: 24px;">Your AI Spend Audit is ready</h1>
      <p>Hi${companyName ? ` from ${companyName}` : ''},</p>
      <p>Thanks for using SpendLens. Your audit results are saved and shareable at the link below.</p>
      <a href="${shareUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
        View your audit →
      </a>
      <p style="color: #6b7280; font-size: 14px;">
        If your audit showed significant savings, our team at Credex may reach out — we sell discounted AI credits at up to 40% off retail.
      </p>
      <p style="color: #9ca3af; font-size: 12px;">SpendLens by Credex · credex.rocks</p>
    </div>
  `;
}

export default router;
