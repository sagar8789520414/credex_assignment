import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TOOLS } from '@/lib/pricingData';
import { saveFormState, loadFormState } from '@/lib/storage';
import { saveAudit } from '@/lib/storage';
import { runAudit } from '@/lib/auditEngine';
import type { FormState, ToolEntry, UseCase, ToolId } from '@/types';

const DEFAULT_TOOL: ToolEntry = { toolId: 'cursor', plan: 'pro', monthlySpend: 0, seats: 1 };

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: 'coding', label: 'Coding / Engineering' },
  { value: 'writing', label: 'Writing / Content' },
  { value: 'data', label: 'Data / Analytics' },
  { value: 'research', label: 'Research' },
  { value: 'mixed', label: 'Mixed / General' },
];

const VALID_TOOL_IDS = new Set(TOOLS.map(t => t.id));

function sanitizeTools(tools: ToolEntry[]): ToolEntry[] {
  return tools.map(t => {
    // If toolId is invalid/missing, fall back to default
    const toolId = VALID_TOOL_IDS.has(t.toolId) ? t.toolId : DEFAULT_TOOL.toolId;
    const toolInfo = TOOLS.find(tl => tl.id === toolId)!;
    // If plan is invalid for this tool, fall back to first plan
    const validPlan = toolInfo.plans.find(p => p.id === t.plan)?.id ?? toolInfo.plans[0].id;
    return { ...t, toolId, plan: validPlan };
  });
}

export default function SpendForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only restore saved state when navigating back from the results page.
  // A fresh page load always starts with empty defaults.
  const restoredFromEdit = location.state?.fromResults === true;

  const [tools, setTools] = useState<ToolEntry[]>(() => {
    if (!restoredFromEdit) return [{ ...DEFAULT_TOOL }];
    const saved = loadFormState();
    return saved?.tools ? sanitizeTools(saved.tools) : [{ ...DEFAULT_TOOL }];
  });
  const [teamSize, setTeamSize] = useState<number>(() => {
    if (!restoredFromEdit) return 5;
    return loadFormState()?.teamSize ?? 5;
  });
  const [useCase, setUseCase] = useState<UseCase>(() => {
    if (!restoredFromEdit) return 'coding';
    return loadFormState()?.useCase ?? 'coding';
  });

  // Persist on every change so "Edit inputs" can restore it
  useEffect(() => {
    saveFormState({ tools, teamSize, useCase });
  }, [tools, teamSize, useCase]);

  function addTool() {
    setTools(prev => [...prev, { ...DEFAULT_TOOL }]);
  }

  function removeTool(idx: number) {
    setTools(prev => prev.filter((_, i) => i !== idx));
  }

  function updateTool(idx: number, patch: Partial<ToolEntry>) {
    setTools(prev =>
      prev.map((t, i) => {
        if (i !== idx) return t;
        const updated = { ...t, ...patch };
        // When tool changes, reset plan to first available
        if (patch.toolId) {
          const toolInfo = TOOLS.find(tl => tl.id === patch.toolId);
          updated.plan = toolInfo?.plans[0]?.id ?? '';
        }
        return updated;
      })
    );
  }

  function getPlansForTool(toolId: ToolId) {
    return TOOLS.find(t => t.id === toolId)?.plans ?? [];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form: FormState = { tools, teamSize, useCase };
    const result = runAudit(form);
    saveAudit(result);
    navigate(`/results/${result.id}`);
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
          <span className="text-zinc-400 text-sm ml-auto">AI Spend Audit</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">
            Are you overpaying for AI tools?
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Enter your current AI subscriptions and get an instant audit — free, no login required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team context */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold leading-none tracking-tight text-zinc-900">Your team</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min={1}
                  max={10000}
                  value={teamSize}
                  onChange={e => setTeamSize(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="useCase">Primary use case</Label>
                <Select value={useCase} onValueChange={v => setUseCase(v as UseCase)}>
                  <SelectTrigger id="useCase" aria-label="Primary use case">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USE_CASES.map(uc => (
                      <SelectItem key={uc.value} value={uc.value}>{uc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tool entries */}
          <div className="space-y-4">
            {tools.map((tool, idx) => {
              const plans = getPlansForTool(tool.toolId);
              return (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tool selector */}
                      <div className="space-y-2">
                        <Label htmlFor={`tool-${idx}`}>AI Tool</Label>
                        <Select
                          value={tool.toolId}
                          onValueChange={v => updateTool(idx, { toolId: v as ToolId })}
                        >
                          <SelectTrigger id={`tool-${idx}`} aria-label={`AI tool ${idx + 1}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOOLS.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Plan selector */}
                      <div className="space-y-2">
                        <Label htmlFor={`plan-${idx}`}>Plan</Label>
                        <Select
                          value={tool.plan}
                          onValueChange={v => updateTool(idx, { plan: v })}
                        >
                          <SelectTrigger id={`plan-${idx}`} aria-label={`Plan for tool ${idx + 1}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.label}{p.pricePerSeat > 0 ? ` — $${p.pricePerSeat}/seat` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Monthly spend */}
                      <div className="space-y-2">
                        <Label htmlFor={`spend-${idx}`}>Monthly spend ($)</Label>
                        <Input
                          id={`spend-${idx}`}
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="e.g. 200"
                          value={tool.monthlySpend || ''}
                          onChange={e => updateTool(idx, { monthlySpend: Number(e.target.value) })}
                          required
                        />
                      </div>

                      {/* Seats */}
                      <div className="space-y-2">
                        <Label htmlFor={`seats-${idx}`}>Number of seats</Label>
                        <Input
                          id={`seats-${idx}`}
                          type="number"
                          min={1}
                          placeholder="e.g. 5"
                          value={tool.seats || ''}
                          onChange={e => updateTool(idx, { seats: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    {tools.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTool(idx)}
                        className="mt-4 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        aria-label={`Remove tool ${idx + 1}`}
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" /> Remove
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button type="button" variant="outline" onClick={addTool} className="w-full gap-2">
            <PlusCircle className="w-4 h-4" /> Add another tool
          </Button>

          <Button type="submit" size="lg" className="w-full text-base font-semibold">
            Run my free audit →
          </Button>
        </form>
      </main>
    </div>
  );
}
