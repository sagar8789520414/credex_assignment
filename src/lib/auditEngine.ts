import { nanoid } from 'nanoid';
import type { FormState, AuditResult, ToolRecommendation, ToolEntry, UseCase } from '@/types';
import { getPlan, getToolName } from './pricingData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// User's manual input is always the source of truth for current spend
function currentSpendFromEntry(entry: ToolEntry): number {
  return entry.monthlySpend;
}

// Price per seat for a given plan (0 for API/free plans)
function pricePerSeat(toolId: string, planId: string): number {
  const plan = getPlan(toolId as never, planId);
  return plan?.pricePerSeat ?? 0;
}

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Seat overkill check — runs before tool-specific rules
// If seats > teamSize, flag the extra seats as waste.
// Savings = (seats - teamSize) * pricePerSeat, proportional to user's actual bill.
// ---------------------------------------------------------------------------

function checkSeatOverkill(
  entry: ToolEntry,
  teamSize: number,
): ToolRecommendation | null {
  const { seats, toolId, plan } = entry;
  if (seats <= teamSize) return null;

  const pps = pricePerSeat(toolId, plan);
  // For API/free plans we can't calculate per-seat savings — skip
  if (pps === 0) return null;

  const currentSpend = currentSpendFromEntry(entry);
  const extraSeats = seats - teamSize;
  // Savings are proportional: (extraSeats / seats) * userSpend
  const monthlySavings = (extraSeats / seats) * currentSpend;
  const projectedSpend = currentSpend - monthlySavings;

  return {
    toolId: entry.toolId,
    toolName: getToolName(entry.toolId),
    currentSpend,
    recommendedAction: `Reduce seat count to ${teamSize}`,
    projectedSpend,
    monthlySavings,
    annualSavings: monthlySavings * 12,
    reason: `You have ${seats} seats but only ${teamSize} people on your team. Removing ${extraSeats} unused seat${extraSeats > 1 ? 's' : ''} saves ${fmt(monthlySavings)}/mo.`,
    severity: 'overspending',
  };
}

// ---------------------------------------------------------------------------
// Per-tool audit rules
// ---------------------------------------------------------------------------

function auditCursor(entry: ToolEntry, useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;
  const expectedSpend = pricePerSeat('cursor', entry.plan) * seats;

  // Check if user spend significantly deviates from plan pricing
  if (currentSpend > expectedSpend * 1.5) {
    return {
      toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
      recommendedAction: 'Verify your spend — it exceeds the plan price',
      projectedSpend: expectedSpend,
      monthlySavings: currentSpend - expectedSpend,
      annualSavings: (currentSpend - expectedSpend) * 12,
      reason: `You entered $${fmt(currentSpend)}/mo for Cursor ${entry.plan} with ${seats} seat${seats > 1 ? 's' : ''}, but the plan costs $${fmt(expectedSpend)}/mo. Check if you're on a different plan or have add-ons.`,
      severity: 'overspending',
    };
  }

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (entry.plan === 'business' && seats <= 3) {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Pro', recommendedPlan: 'Pro',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Business plan adds admin controls and SSO — unnecessary for a ${seats}-person team. Pro ($20/seat) covers all core AI features.`,
        severity: 'overspending',
      };
    }
  }

  if (useCase !== 'coding' && useCase !== 'mixed' && entry.plan !== 'hobby') {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Consider switching to Claude Pro or ChatGPT Plus',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Cursor is optimised for code generation. For ${useCase} workflows, Claude Pro ($20/seat) or ChatGPT Plus ($20/seat) delivers better value.`,
        severity: 'consider_switch',
      };
    }
  }

  if (entry.plan === 'enterprise' && seats < 10) {
    const projectedSpend = 40 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Business', recommendedPlan: 'Business',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Enterprise tier is designed for large orgs with compliance needs. Business ($40/seat) covers team management for teams under 10.`,
        severity: 'overspending',
      };
    }
  }

  return optimal(entry, currentSpend, 'Cursor is well-matched to your team size and use case.');
}

function auditGithubCopilot(entry: ToolEntry, useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;
  const expectedSpend = pricePerSeat('github-copilot', entry.plan) * seats;

  // Check if user spend significantly deviates from plan pricing
  if (currentSpend > expectedSpend * 1.5) {
    return {
      toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
      recommendedAction: 'Verify your spend — it exceeds the plan price',
      projectedSpend: expectedSpend,
      monthlySavings: currentSpend - expectedSpend,
      annualSavings: (currentSpend - expectedSpend) * 12,
      reason: `You entered $${fmt(currentSpend)}/mo for GitHub Copilot ${entry.plan} with ${seats} seat${seats > 1 ? 's' : ''}, but the plan costs $${fmt(expectedSpend)}/mo. Check if you're on a different plan or have add-ons.`,
      severity: 'overspending',
    };
  }

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (useCase !== 'coding' && useCase !== 'mixed') {
    return {
      toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
      recommendedAction: 'Consider cancelling — wrong tool for your use case',
      projectedSpend: 0,
      monthlySavings: currentSpend,
      annualSavings: currentSpend * 12,
      reason: `GitHub Copilot is a code-completion tool. For ${useCase} tasks, Claude Pro or ChatGPT Plus provides far more value at the same price point.`,
      severity: 'consider_switch',
    };
  }

  if (entry.plan === 'enterprise' && seats < 20) {
    const projectedSpend = 19 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Business', recommendedPlan: 'Business',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Copilot Enterprise adds Copilot Chat in GitHub.com and knowledge bases — valuable at scale, but Business ($19/seat) covers all IDE features for teams under 20.`,
        severity: 'overspending',
      };
    }
  }

  return optimal(entry, currentSpend, 'GitHub Copilot is appropriately sized for your team.');
}

function auditClaude(entry: ToolEntry, useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;
  const expectedSpend = pricePerSeat('claude', entry.plan) * seats;

  // Check if user spend significantly deviates from plan pricing
  if (currentSpend > expectedSpend * 1.5) {
    return {
      toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
      recommendedAction: 'Verify your spend — it exceeds the plan price',
      projectedSpend: expectedSpend,
      monthlySavings: currentSpend - expectedSpend,
      annualSavings: (currentSpend - expectedSpend) * 12,
      reason: `You entered $${fmt(currentSpend)}/mo for Claude ${entry.plan} with ${seats} seat${seats > 1 ? 's' : ''}, but the plan costs $${fmt(expectedSpend)}/mo. Check if you're on a different plan or have add-ons.`,
      severity: 'overspending',
    };
  }

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (entry.plan === 'team' && seats < 5) {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Switch to individual Pro plans', recommendedPlan: 'Pro',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Claude Team requires a minimum of 5 seats ($30/seat). With ${seats} users, individual Pro plans ($20/seat) save money and have no seat minimum.`,
        severity: 'overspending',
      };
    }
  }

  if ((entry.plan === 'max_5x' || entry.plan === 'max_20x') && useCase !== 'research' && useCase !== 'data') {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Pro', recommendedPlan: 'Pro',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Claude Max is for users who hit Pro's usage limits daily. For ${useCase} workflows, Pro ($20/seat) provides ample capacity and saves ${fmt(currentSpend - projectedSpend)}/mo.`,
        severity: 'overspending',
      };
    }
  }

  return optimal(entry, currentSpend, 'Claude plan is well-matched to your usage pattern.');
}

function auditChatGPT(entry: ToolEntry, _useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;
  const expectedSpend = pricePerSeat('chatgpt', entry.plan) * seats;

  // Check if user spend significantly deviates from plan pricing
  if (currentSpend > expectedSpend * 1.5) {
    return {
      toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
      recommendedAction: 'Verify your spend — it exceeds the plan price',
      projectedSpend: expectedSpend,
      monthlySavings: currentSpend - expectedSpend,
      annualSavings: (currentSpend - expectedSpend) * 12,
      reason: `You entered $${fmt(currentSpend)}/mo for ChatGPT ${entry.plan} with ${seats} seat${seats > 1 ? 's' : ''}, but the plan costs $${fmt(expectedSpend)}/mo. Check if you're on a different plan or have add-ons.`,
      severity: 'overspending',
    };
  }

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (entry.plan === 'team' && seats <= 2) {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Switch to individual Plus plans', recommendedPlan: 'Plus',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `ChatGPT Team ($30/seat) adds admin controls and higher limits. With only ${seats} users, individual Plus plans ($20/seat) cover the same AI capabilities at lower cost.`,
        severity: 'overspending',
      };
    }
  }

  if (entry.plan === 'enterprise' && seats < 15) {
    const projectedSpend = 30 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Team', recommendedPlan: 'Team',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `ChatGPT Enterprise is designed for large orgs needing SSO, audit logs, and dedicated capacity. Team ($30/seat) covers collaborative AI for teams under 15.`,
        severity: 'overspending',
      };
    }
  }

  return optimal(entry, currentSpend, 'ChatGPT plan is appropriate for your team size and use case.');
}

function auditAnthropicApi(entry: ToolEntry): ToolRecommendation {
  // Note: _teamSize and _useCase not used for API audits — only subscription plans use them
  const currentSpend = currentSpendFromEntry(entry);

  if (currentSpend > 100 * entry.seats) {
    const projectedSpend = 20 * entry.seats;
    return {
      toolId: entry.toolId, toolName: 'Anthropic API', currentSpend,
      recommendedAction: 'Audit token usage — consider Claude Pro for interactive use',
      projectedSpend,
      monthlySavings: currentSpend - projectedSpend,
      annualSavings: (currentSpend - projectedSpend) * 12,
      reason: `At ${fmt(currentSpend)}/mo, your API spend exceeds what Claude Pro subscriptions would cost for ${entry.seats} users. If usage is interactive (not automated pipelines), subscriptions are more cost-effective.`,
      severity: 'overspending',
    };
  }

  return optimal(entry, currentSpend, "API spend looks proportionate. Ensure you're on the right model tier for your latency/cost needs.");
}

function auditOpenAiApi(entry: ToolEntry): ToolRecommendation {
  // Note: _teamSize and _useCase not used for API audits — only subscription plans use them
  const currentSpend = currentSpendFromEntry(entry);

  if (currentSpend > 100 * entry.seats) {
    return {
      toolId: entry.toolId, toolName: 'OpenAI API', currentSpend,
      recommendedAction: 'Review model selection — GPT-4o-mini vs GPT-4o for your tasks',
      projectedSpend: currentSpend * 0.6,
      monthlySavings: currentSpend * 0.4,
      annualSavings: currentSpend * 0.4 * 12,
      reason: `GPT-4o-mini costs ~15x less than GPT-4o for tasks that don't require frontier reasoning. Routing non-complex calls to mini could cut your bill by ~40%.`,
      severity: 'overspending',
    };
  }

  return optimal(entry, currentSpend, 'OpenAI API spend is within a reasonable range for your team size.');
}

function auditGemini(entry: ToolEntry, useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (entry.plan !== 'free' && entry.plan !== 'api' && useCase === 'coding') {
    const projectedSpend = 10 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Switch to GitHub Copilot Individual',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `You're using Gemini (a general assistant) for coding workflows. GitHub Copilot Individual ($10/seat) is purpose-built for code and costs ${fmt(currentSpend - projectedSpend)}/mo less than your current spend.`,
        severity: 'consider_switch',
      };
    }
  }

  return optimal(entry, currentSpend, 'Gemini plan is appropriate for your use case.');
}

function auditWindsurf(entry: ToolEntry, useCase: UseCase, teamSize: number): ToolRecommendation {
  const currentSpend = currentSpendFromEntry(entry);
  const seats = entry.seats;

  const seatCheck = checkSeatOverkill(entry, teamSize);
  if (seatCheck) return seatCheck;

  if (useCase !== 'coding' && useCase !== 'mixed' && entry.plan !== 'free') {
    const projectedSpend = 20 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Consider switching to a general-purpose AI tool',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Windsurf is a code-focused AI IDE. For ${useCase} tasks, Claude Pro or ChatGPT Plus offers better capability at a comparable price.`,
        severity: 'consider_switch',
      };
    }
  }

  if (entry.plan === 'teams' && seats <= 2) {
    const projectedSpend = 15 * seats;
    if (currentSpend > projectedSpend) {
      return {
        toolId: entry.toolId, toolName: getToolName(entry.toolId), currentSpend,
        recommendedAction: 'Downgrade to Pro', recommendedPlan: 'Pro',
        projectedSpend,
        monthlySavings: currentSpend - projectedSpend,
        annualSavings: (currentSpend - projectedSpend) * 12,
        reason: `Windsurf Teams adds collaboration features unnecessary for ${seats} users. Pro ($15/seat) covers all AI coding features.`,
        severity: 'overspending',
      };
    }
  }

  return optimal(entry, currentSpend, 'Windsurf plan is well-matched to your team.');
}

// ---------------------------------------------------------------------------
// Redundant IDE consolidation
// If use case is coding and user has 2+ paid IDE tools, flag the more expensive
// one(s) for removal. Savings = full currentSpend of the redundant tool.
// ---------------------------------------------------------------------------

function applyRedundantIdeFlags(
  recommendations: ToolRecommendation[],
  entries: ToolEntry[],
  useCase: UseCase,
): ToolRecommendation[] {
  if (useCase !== 'coding' && useCase !== 'mixed') return recommendations;

  const IDE_IDS = ['cursor', 'github_copilot', 'windsurf'];

  const paidIdeEntries = entries.filter(
    e => IDE_IDS.includes(e.toolId) && e.plan !== 'free' && e.plan !== 'hobby',
  );

  // Group by toolId to avoid flagging multiple entries of the same tool
  const toolIdToEntries = new Map<string, ToolEntry[]>();
  for (const entry of paidIdeEntries) {
    if (!toolIdToEntries.has(entry.toolId)) {
      toolIdToEntries.set(entry.toolId, []);
    }
    toolIdToEntries.get(entry.toolId)!.push(entry);
  }

  // Only flag if there are multiple different tools
  if (toolIdToEntries.size < 2) return recommendations;

  // Sort by total spend per tool descending — keep cheapest, flag the rest
  const toolSpends = Array.from(toolIdToEntries.entries()).map(([toolId, toolEntries]) => ({
    toolId,
    totalSpend: toolEntries.reduce((sum, e) => sum + currentSpendFromEntry(e), 0),
  }));

  const sorted = toolSpends.sort((a, b) => b.totalSpend - a.totalSpend);
  const keepToolId = sorted[sorted.length - 1].toolId; // cheapest tool
  const redundantToolIds = new Set(sorted.slice(0, sorted.length - 1).map(t => t.toolId));
  const keepName = getToolName(keepToolId);

  return recommendations.map(rec => {
    if (!redundantToolIds.has(rec.toolId)) return rec;

    const currentSpend = rec.currentSpend;
    return {
      ...rec,
      recommendedAction: `Remove — redundant with ${keepName}`,
      projectedSpend: 0,
      monthlySavings: currentSpend,
      annualSavings: currentSpend * 12,
      reason: `Your team has multiple paid coding IDEs. Standardising on ${keepName} (your lowest-cost option) and removing ${rec.toolName} saves ${fmt(currentSpend)}/mo.`,
      severity: 'overspending' as const,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function optimal(entry: ToolEntry, currentSpend: number, reason: string): ToolRecommendation {
  return {
    toolId: entry.toolId,
    toolName: getToolName(entry.toolId),
    currentSpend,
    recommendedAction: 'Keep current plan',
    projectedSpend: currentSpend,
    monthlySavings: 0,
    annualSavings: 0,
    reason,
    severity: 'optimal',
  };
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

const AUDITORS: Record<string, (e: ToolEntry, u: UseCase, t: number) => ToolRecommendation> = {
  cursor: auditCursor,
  github_copilot: auditGithubCopilot,
  claude: auditClaude,
  chatgpt: auditChatGPT,
  anthropic_api: (e) => auditAnthropicApi(e),
  openai_api: (e) => auditOpenAiApi(e),
  gemini: auditGemini,
  windsurf: auditWindsurf,
};

export function runAudit(form: FormState): AuditResult {
  let recommendations = form.tools
    .filter(t => t.toolId && t.plan)
    .map(entry => {
      const auditor = AUDITORS[entry.toolId];
      return auditor
        ? auditor(entry, form.useCase, form.teamSize)
        : optimal(entry, currentSpendFromEntry(entry), 'No specific recommendations for this tool.');
    });

  // Apply redundant IDE consolidation (overrides individual tool results for flagged tools)
  recommendations = applyRedundantIdeFlags(recommendations, form.tools, form.useCase);

  const totalMonthlySpend = recommendations.reduce((s, r) => s + r.currentSpend, 0);
  const totalProjectedSpend = recommendations.reduce((s, r) => s + r.projectedSpend, 0);
  const totalMonthlySavings = totalMonthlySpend - totalProjectedSpend;
  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    id: nanoid(10),
    recommendations,
    totalMonthlySpend,
    totalProjectedSpend,
    totalMonthlySavings,
    totalAnnualSavings,
    useCase: form.useCase,
    teamSize: form.teamSize,
    createdAt: new Date().toISOString(),
  };
}
