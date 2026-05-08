import { describe, it, expect } from 'vitest';
import { runAudit } from '@/lib/auditEngine';
import type { FormState } from '@/types';

// ---------------------------------------------------------------------------
// Test 1: Cursor Business plan for small team → recommend downgrade to Pro
// ---------------------------------------------------------------------------
describe('Cursor audit', () => {
  it('flags Business plan as overspending for ≤3 seats', () => {
    const form: FormState = {
      tools: [{ toolId: 'cursor', plan: 'business', monthlySpend: 120, seats: 3 }],
      teamSize: 3,
      useCase: 'coding',
    };
    const result = runAudit(form);
    const rec = result.recommendations[0];

    expect(rec.severity).toBe('overspending');
    expect(rec.recommendedPlan).toBe('Pro');
    expect(rec.monthlySavings).toBe(60); // 120 - (20*3)
    expect(rec.annualSavings).toBe(720);
  });

  it('marks Cursor Pro for a coding team as optimal', () => {
    const form: FormState = {
      tools: [{ toolId: 'cursor', plan: 'pro', monthlySpend: 100, seats: 5 }],
      teamSize: 5,
      useCase: 'coding',
    };
    const result = runAudit(form);
    expect(result.recommendations[0].severity).toBe('optimal');
    expect(result.recommendations[0].monthlySavings).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Claude Team with <5 seats → recommend individual Pro
// ---------------------------------------------------------------------------
describe('Claude audit', () => {
  it('flags Team plan as overspending for <5 seats', () => {
    const form: FormState = {
      tools: [{ toolId: 'claude', plan: 'team', monthlySpend: 90, seats: 3 }],
      teamSize: 3,
      useCase: 'writing',
    };
    const result = runAudit(form);
    const rec = result.recommendations[0];

    expect(rec.severity).toBe('overspending');
    expect(rec.recommendedPlan).toBe('Pro');
    expect(rec.monthlySavings).toBe(30); // 90 - (20*3)
  });

  it('marks Claude Max as overspending for non-research use case', () => {
    const form: FormState = {
      tools: [{ toolId: 'claude', plan: 'max_5x', monthlySpend: 100, seats: 1 }],
      teamSize: 1,
      useCase: 'coding',
    };
    const result = runAudit(form);
    const rec = result.recommendations[0];

    expect(rec.severity).toBe('overspending');
    expect(rec.monthlySavings).toBe(80); // 100 - 20
  });
});

// ---------------------------------------------------------------------------
// Test 3: ChatGPT Team for 2 users → recommend Plus
// ---------------------------------------------------------------------------
describe('ChatGPT audit', () => {
  it('flags Team plan as overspending for ≤2 seats', () => {
    const form: FormState = {
      tools: [{ toolId: 'chatgpt', plan: 'team', monthlySpend: 60, seats: 2 }],
      teamSize: 2,
      useCase: 'mixed',
    };
    const result = runAudit(form);
    const rec = result.recommendations[0];

    expect(rec.severity).toBe('overspending');
    expect(rec.recommendedPlan).toBe('Plus');
    expect(rec.monthlySavings).toBe(20); // 60 - (20*2)
  });
});

// ---------------------------------------------------------------------------
// Test 4: Total savings calculation across multiple tools
// ---------------------------------------------------------------------------
describe('Total savings calculation', () => {
  it('correctly sums savings across multiple overspending tools', () => {
    const form: FormState = {
      tools: [
        { toolId: 'cursor', plan: 'business', monthlySpend: 120, seats: 3 },   // saves 60
        { toolId: 'claude', plan: 'team', monthlySpend: 90, seats: 3 },         // saves 30
        { toolId: 'chatgpt', plan: 'plus', monthlySpend: 20, seats: 1 },        // optimal
      ],
      teamSize: 3,
      useCase: 'coding',
    };
    const result = runAudit(form);

    expect(result.totalMonthlySavings).toBe(90);
    expect(result.totalAnnualSavings).toBe(1080);
  });
});

// ---------------------------------------------------------------------------
// Test 5: OpenAI API high spend → recommend model routing
// ---------------------------------------------------------------------------
describe('OpenAI API audit', () => {
  it('flags high API spend and recommends model routing', () => {
    const form: FormState = {
      tools: [{ toolId: 'openai_api', plan: 'pay_as_you_go', monthlySpend: 500, seats: 1 }],
      teamSize: 5,
      useCase: 'data',
    };
    const result = runAudit(form);
    const rec = result.recommendations[0];

    expect(rec.severity).toBe('overspending');
    expect(rec.monthlySavings).toBeGreaterThan(0);
    expect(rec.reason).toContain('mini');
  });
});

// ---------------------------------------------------------------------------
// Test 6: Overlap detection — two coding IDEs
// ---------------------------------------------------------------------------
describe('Overlap detection', () => {
  it('flags paying for both Cursor and GitHub Copilot', () => {
    const form: FormState = {
      tools: [
        { toolId: 'cursor', plan: 'pro', monthlySpend: 100, seats: 5 },
        { toolId: 'github_copilot', plan: 'individual', monthlySpend: 50, seats: 5 },
      ],
      teamSize: 5,
      useCase: 'coding',
    };
    const result = runAudit(form);
    const codingRecs = result.recommendations.filter(r =>
      ['cursor', 'github_copilot'].includes(r.toolId)
    );
    const hasOverlapWarning = codingRecs.some(r =>
      r.reason.includes('multiple paid coding IDEs') || r.reason.includes('redundant')
    );
    expect(hasOverlapWarning).toBe(true);
  });
});
