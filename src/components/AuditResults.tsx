import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, TrendingDown, CheckCircle, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { loadAudit } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import type { AuditResult, ToolRecommendation } from '@/types';
import LeadCaptureModal from './LeadCaptureModal';
import AISummary from './AISummary';

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  function showToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function loadResult() {
      const result = loadAudit(id!);
      if (!result) { 
        navigate('/'); 
        return; 
      }
      if (!cancelled) {
        setAudit(result);
      }
    }

    loadResult();
    return () => { cancelled = true; };
  }, [id, navigate]);

  useEffect(() => {
    // Separate effect to avoid setState in effect
  }, []);

  if (!audit) return null;

  const highSavings = audit.totalMonthlySavings > 500;
  const totalMonthlySavings = audit.totalMonthlySavings;
  const hasAnySavings = totalMonthlySavings > 0;
  const isSmallSavings = totalMonthlySavings > 0 && totalMonthlySavings <= 100;

  async function handleShare() {
    setSharing(true);
    try {
      // Ensure audit is persisted to backend before sharing
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audit),
      });
      if (!res.ok) throw new Error('persist failed');
    } catch (err) {
      console.error('[share] Failed to persist audit:', err);
      showToast('Failed to save audit. Please try again.');
      setSharing(false);
      return;
    }

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    console.log('[share] Generated share URL:', { 
      appUrl, 
      viteAppUrlSet: !!import.meta.env.VITE_APP_URL,
      windowOrigin: window.location.origin,
      auditId: audit!.id 
    });
    const shareUrl = `${appUrl}/share/${audit!.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch {
      // Fallback for browsers that block clipboard without interaction
      showToast(`Share: ${shareUrl}`);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-emerald-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-zinc-900 text-lg">SpendLens</span>
          <Link to="/" state={{ fromResults: true }} className="ml-auto flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
            <ArrowLeft className="w-4 h-4" /> Edit inputs
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Hero savings card */}
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
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-zinc-900 mb-1">You're spending well.</h2>
                <p className="text-zinc-500">Your AI stack looks optimised. No savings opportunities found.</p>
              </>
            ) : isSmallSavings ? (
              <>
                <TrendingDown className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">Small optimisation opportunities found</p>
                <div className="text-4xl font-extrabold text-zinc-900 mb-1">
                  {formatCurrency(audit.totalMonthlySavings)}<span className="text-xl font-semibold text-zinc-500">/mo</span>
                </div>
                <div className="text-lg text-zinc-600 font-medium">
                  {formatCurrency(audit.totalAnnualSavings)} per year
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  Current spend: {formatCurrency(audit.totalMonthlySpend)}/mo → Optimised: {formatCurrency(audit.totalProjectedSpend)}/mo
                </p>
              </>
            ) : (
              <>
                <TrendingDown className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">Potential savings identified</p>
                <div className="text-5xl font-extrabold text-zinc-900 mb-1">
                  {formatCurrency(audit.totalMonthlySavings)}<span className="text-2xl font-semibold text-zinc-500">/mo</span>
                </div>
                <div className="text-xl text-zinc-600 font-medium">
                  {formatCurrency(audit.totalAnnualSavings)} per year
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  Current spend: {formatCurrency(audit.totalMonthlySpend)}/mo → Optimised: {formatCurrency(audit.totalProjectedSpend)}/mo
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Summary */}
        <AISummary audit={audit} />

        {/* Credex CTA for high savings */}
        {highSavings && (
          <Card className="border-2 border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Capture even more savings with Credex</h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    You're leaving {formatCurrency(audit.totalMonthlySavings)}/mo on the table. Credex sells discounted AI credits — Cursor, Claude, ChatGPT Enterprise — at up to 40% off retail. Book a free 15-min consultation.
                  </p>
                  <a
                    href="https://credex.rocks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-emerald-50 transition-colors"
                  >
                    Book a Credex consultation <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-tool breakdown */}
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Tool-by-tool breakdown</h2>
          <div className="space-y-3">
            {audit.recommendations.map(rec => (
              <RecommendationCard key={rec.toolId} rec={rec} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setShowLeadModal(true)} size="lg" className="flex-1">
            {hasAnySavings ? 'Get full report by email' : 'Notify me when optimisations apply'}
          </Button>
          <Button variant="outline" onClick={handleShare} size="lg" className="gap-2" disabled={sharing}>
            <Share2 className="w-4 h-4" aria-hidden="true" />
            {sharing ? 'Saving…' : 'Share results'}
          </Button>
        </div>

      </main>

      {showLeadModal && (
        <LeadCaptureModal auditId={audit.id} onClose={() => setShowLeadModal(false)} />
      )}

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
                  <span className="text-zinc-300">→</span>
                  <span className="text-zinc-500">Recommended: <strong>{formatCurrency(rec.projectedSpend)}/mo</strong></span>
                </>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-700 mt-1">{rec.recommendedAction}</p>
          </div>
          {rec.monthlySavings > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-emerald-600">-{formatCurrency(rec.monthlySavings)}</div>
              <div className="text-xs text-zinc-400">per month</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
