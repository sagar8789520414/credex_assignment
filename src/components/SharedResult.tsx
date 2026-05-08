import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Zap, TrendingDown, CheckCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { loadAudit, loadAuditRemote } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { AuditResult, ToolRecommendation } from '@/types';

// Strip any PII fields — only tool data and savings numbers are shown publicly
function anonymize(audit: AuditResult): AuditResult {
  // AuditResult has no PII fields by design — email/company live only in the
  // leads table. This function is a defensive guard for future schema changes.
  const safe = { ...audit };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (safe as any).email;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (safe as any).companyName;
  return safe;
}

export default function SharedResult() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  function showToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  useEffect(() => {
    if (!id) return;
    async function fetchAudit() {
      // Try localStorage first (instant for same browser)
      let result = loadAudit(id!);
      // Fall back to backend (cross-device share links)
      if (!result) result = await loadAuditRemote(id!);
      setAudit(result ? anonymize(result) : null);
      setLoading(false);
    }
    fetchAudit();
  }, [id]);

  async function handleCopyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!');
    } catch {
      showToast(url);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-emerald-50 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse text-sm">Loading audit…</div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-500">Audit not found or the link has expired.</p>
          <Link to="/"><Button>Run your own audit →</Button></Link>
        </div>
      </div>
    );
  }

  const totalMonthlySavings = audit.totalMonthlySavings;
  const isSmallSavings = totalMonthlySavings > 0 && totalMonthlySavings <= 100;
  const highSavings = totalMonthlySavings > 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-emerald-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center" aria-hidden="true">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-zinc-900 text-lg">SpendLens</span>
          <span className="text-zinc-400 text-sm ml-auto">Shared Audit</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Hero — 3 states matching private view */}
        <Card className={`border-2 ${
          totalMonthlySavings === 0
            ? 'border-zinc-200'
            : isSmallSavings
              ? 'border-amber-200 bg-amber-50'
              : highSavings
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-amber-300 bg-amber-50'
        }`}>
          <CardContent className="pt-8 pb-8 text-center">
            {totalMonthlySavings === 0 ? (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" aria-hidden="true" />
                <h1 className="text-2xl font-bold text-zinc-900 mb-1">This team is spending well.</h1>
                <p className="text-zinc-500">Their AI stack looks optimised — no savings opportunities found.</p>
              </>
            ) : isSmallSavings ? (
              <>
                <TrendingDown className="w-10 h-10 text-amber-500 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">Small optimisation opportunities found</p>
                <h1 className="text-4xl font-extrabold text-zinc-900 mb-1">
                  {formatCurrency(audit.totalMonthlySavings)}<span className="text-xl font-semibold text-zinc-500">/mo</span>
                </h1>
                <p className="text-lg text-zinc-600 font-medium">{formatCurrency(audit.totalAnnualSavings)} per year</p>
              </>
            ) : (
              <>
                <TrendingDown className="w-12 h-12 text-emerald-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">Potential savings identified</p>
                <h1 className="text-5xl font-extrabold text-zinc-900 mb-1">
                  {formatCurrency(audit.totalMonthlySavings)}<span className="text-2xl font-semibold text-zinc-500">/mo</span>
                </h1>
                <p className="text-xl text-zinc-600 font-medium">{formatCurrency(audit.totalAnnualSavings)} per year</p>
                <p className="text-sm text-zinc-500 mt-2">
                  Current spend: {formatCurrency(audit.totalMonthlySpend)}/mo → Optimised: {formatCurrency(audit.totalProjectedSpend)}/mo
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tool-by-tool breakdown — anonymized (no email/company shown) */}
        <section aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-xl font-bold text-zinc-900 mb-4">Tool-by-tool breakdown</h2>
          <div className="space-y-3">
            {audit.recommendations.map(rec => (
              <RecommendationCard key={rec.toolId} rec={rec} />
            ))}
          </div>
        </section>

        {/* Share this link */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleCopyLink} className="gap-2">
            <Share2 className="w-4 h-4" aria-hidden="true" />
            Copy this link
          </Button>
        </div>

        {/* CTA */}
        <Card className="border-2 border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardContent className="pt-6 pb-6 text-center">
            <h2 className="font-bold text-xl mb-2">Run your own AI spend audit</h2>
            <p className="text-emerald-100 text-sm mb-4">
              Free, no login required. Get instant recommendations and see where you can save.
            </p>
            <Link to="/">
              <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-50">
                Audit my AI spend →
              </Button>
            </Link>
          </CardContent>
        </Card>

      </main>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

function RecommendationCard({ rec }: { rec: ToolRecommendation }) {
  const isOptimal = rec.severity === 'optimal';
  const isOverspending = rec.severity === 'overspending';

  return (
    <Card className={`border ${isOverspending ? 'border-amber-200' : isOptimal ? 'border-zinc-200' : 'border-blue-200'}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-zinc-900">{rec.toolName}</span>
              <Badge variant={isOverspending ? 'warning' : isOptimal ? 'default' : 'secondary'}>
                {isOverspending ? '⚠ Overspending' : isOptimal ? '✓ Optimal' : '→ Consider switch'}
              </Badge>
            </div>
            <p className="text-sm text-zinc-600 mb-2">{rec.reason}</p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-zinc-500">Current: <strong>{formatCurrency(rec.currentSpend)}/mo</strong></span>
              {!isOptimal && (
                <>
                  <span className="text-zinc-300" aria-hidden="true">→</span>
                  <span className="text-zinc-500">Recommended: <strong>{formatCurrency(rec.projectedSpend)}/mo</strong></span>
                </>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-700 mt-1">{rec.recommendedAction}</p>
          </div>
          {rec.monthlySavings > 0 && (
            <div className="text-right flex-shrink-0" aria-label={`Saves ${formatCurrency(rec.monthlySavings)} per month`}>
              <div className="text-lg font-bold text-emerald-600">-{formatCurrency(rec.monthlySavings)}</div>
              <div className="text-xs text-zinc-400">per month</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
