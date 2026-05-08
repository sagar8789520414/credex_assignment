import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { AuditResult } from '@/types';

interface Props {
  audit: AuditResult;
}

function buildFallbackSummary(audit: AuditResult): string {
  const topSaving = [...audit.recommendations]
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .find(r => r.monthlySavings > 0);

  if (audit.totalMonthlySavings < 100) {
    return `Your AI stack of ${audit.recommendations.length} tool${audit.recommendations.length > 1 ? 's' : ''} is well-optimised for a ${audit.teamSize}-person team focused on ${audit.useCase}. You're spending ${formatCurrency(audit.totalMonthlySpend)}/month — close to the benchmark for your profile. Keep an eye on usage as your team grows; the economics shift quickly above 10 seats.`;
  }

  return `Your ${audit.teamSize}-person team is spending ${formatCurrency(audit.totalMonthlySpend)}/month on AI tools — and we found ${formatCurrency(audit.totalMonthlySavings)}/month in potential savings (${formatCurrency(audit.totalAnnualSavings)}/year). ${topSaving ? `The biggest opportunity is ${topSaving.toolName}: ${topSaving.recommendedAction} could save ${formatCurrency(topSaving.monthlySavings)}/month. ` : ''}These aren't theoretical cuts — they're plan right-sizing based on your team size and ${audit.useCase} use case. Acting on all recommendations would reduce your annual AI spend by ${Math.round((audit.totalMonthlySavings / audit.totalMonthlySpend) * 100)}%.`;
}

export default function AISummary({ audit }: Props) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    // If audit already has a summary (e.g. loaded from storage), use it
    if (audit.aiSummary) {
      setSummary(audit.aiSummary);
      setIsAI(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSummary() {
      try {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('No API key');

        const prompt = buildPrompt(audit);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // Surface credit exhaustion clearly in the console for debugging
          if (res.status === 400 && errData?.error?.message?.includes('credit balance')) {
            console.warn('[AISummary] Anthropic credits exhausted — using fallback summary.');
          }
          throw new Error(`API error ${res.status}`);
        }
        const data = await res.json();
        const text: string = data.content?.[0]?.text ?? '';

        if (!cancelled && text) {
          setSummary(text);
          setIsAI(true);
        } else {
          throw new Error('Empty response');
        }
      } catch (_) {
        if (!cancelled) {
          setSummary(buildFallbackSummary(audit));
          setIsAI(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummary();
    return () => { cancelled = true; };
  }, [audit.id]);

  return (
    <Card className="border border-zinc-200 bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-zinc-700">
            {isAI ? 'AI-generated summary' : 'Audit summary'}
          </span>
          {loading && (
            <span className="text-xs text-zinc-400 animate-pulse">Generating…</span>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
            <div className="h-4 bg-zinc-100 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-zinc-100 rounded animate-pulse w-4/6" />
          </div>
        ) : (
          <p className="text-zinc-600 text-sm leading-relaxed">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}

function buildPrompt(audit: AuditResult): string {
  const toolLines = audit.recommendations
    .map(r => `- ${r.toolName}: $${Math.round(r.currentSpend)}/mo (user-reported) → ${r.recommendedAction} → $${Math.round(r.projectedSpend)}/mo (saves $${Math.round(r.monthlySavings)}/mo)`)
    .join('\n');

  return `You are a concise financial advisor for tech startups. Write a ~100-word personalised audit summary for a ${audit.teamSize}-person team whose primary AI use case is "${audit.useCase}".

Their current AI tool spend and recommendations:
${toolLines}

Total potential savings: $${Math.round(audit.totalMonthlySavings)}/month ($${Math.round(audit.totalAnnualSavings)}/year).

Rules:
- Write in second person ("Your team...").
- Use the exact dollar figures shown above — do not invent or round differently.
- If a general-purpose tool (like Gemini or ChatGPT) is being used for a specialised task (like coding), explicitly call this out and recommend the specialised alternative ONLY if it is actually cheaper based on the numbers above.
- Do not recommend a switch if the alternative costs more than the current spend.
- Do not use bullet points. Write flowing prose.
- Be direct and actionable. No filler phrases.
- Do not mention Credex by name.`;
}
