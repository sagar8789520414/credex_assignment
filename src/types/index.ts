export type ToolId =
  | 'cursor'
  | 'github_copilot'
  | 'claude'
  | 'chatgpt'
  | 'anthropic_api'
  | 'openai_api'
  | 'gemini'
  | 'windsurf';

export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

export interface ToolEntry {
  toolId: ToolId;
  plan: string;
  monthlySpend: number; // user-reported
  seats: number;
}

export interface FormState {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

export interface ToolRecommendation {
  toolId: ToolId;
  toolName: string;
  currentSpend: number;
  recommendedAction: string;
  recommendedPlan?: string;
  projectedSpend: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
  severity: 'overspending' | 'optimal' | 'consider_switch';
}

export interface AuditResult {
  id: string;
  recommendations: ToolRecommendation[];
  totalMonthlySpend: number;
  totalProjectedSpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  aiSummary?: string;
  useCase: UseCase;
  teamSize: number;
  createdAt: string;
}

export interface LeadData {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
  auditId: string;
}
