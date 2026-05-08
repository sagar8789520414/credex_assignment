import type { ToolId } from '@/types';

export interface PlanInfo {
  id: string;
  label: string;
  pricePerSeat: number; // USD/month per seat
  minSeats?: number;
  maxSeats?: number;
  notes?: string;
}

export interface ToolInfo {
  id: ToolId;
  name: string;
  plans: PlanInfo[];
  category: 'coding' | 'chat' | 'api';
}

// Prices verified May 2026 — see PRICING_DATA.md for source URLs
export const TOOLS: ToolInfo[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'coding',
    plans: [
      { id: 'hobby',      label: 'Hobby',      pricePerSeat: 0  },
      { id: 'pro',        label: 'Pro',         pricePerSeat: 20 },
      { id: 'business',   label: 'Business',    pricePerSeat: 40 },
      { id: 'enterprise', label: 'Enterprise',  pricePerSeat: 60, notes: 'Custom pricing; $60 is floor estimate' },
    ],
  },
  {
    id: 'github_copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    plans: [
      { id: 'individual', label: 'Individual',  pricePerSeat: 10 },
      { id: 'business',   label: 'Business',    pricePerSeat: 19 },
      { id: 'enterprise', label: 'Enterprise',  pricePerSeat: 39 },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'chat',
    plans: [
      { id: 'free',       label: 'Free',        pricePerSeat: 0  },
      { id: 'pro',        label: 'Pro',         pricePerSeat: 20 },
      { id: 'max_5x',     label: 'Max (5x)',    pricePerSeat: 100 },
      { id: 'max_20x',    label: 'Max (20x)',   pricePerSeat: 200 },
      { id: 'team',       label: 'Team',        pricePerSeat: 30, minSeats: 5 },
      { id: 'enterprise', label: 'Enterprise',  pricePerSeat: 60, notes: 'Estimated floor' },
      { id: 'api',        label: 'API Direct',  pricePerSeat: 0,  notes: 'Pay-per-token; enter actual monthly spend' },
    ],
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'chat',
    plans: [
      { id: 'free',       label: 'Free',        pricePerSeat: 0  },
      { id: 'plus',       label: 'Plus',        pricePerSeat: 20 },
      { id: 'team',       label: 'Team',        pricePerSeat: 30, minSeats: 2 },
      { id: 'enterprise', label: 'Enterprise',  pricePerSeat: 60, notes: 'Estimated floor' },
      { id: 'api',        label: 'API Direct',  pricePerSeat: 0,  notes: 'Pay-per-token; enter actual monthly spend' },
    ],
  },
  {
    id: 'anthropic_api',
    name: 'Anthropic API',
    category: 'api',
    plans: [
      { id: 'pay_as_you_go', label: 'Pay-as-you-go', pricePerSeat: 0, notes: 'Enter actual monthly spend' },
    ],
  },
  {
    id: 'openai_api',
    name: 'OpenAI API',
    category: 'api',
    plans: [
      { id: 'pay_as_you_go', label: 'Pay-as-you-go', pricePerSeat: 0, notes: 'Enter actual monthly spend' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'chat',
    plans: [
      { id: 'free',       label: 'Free',        pricePerSeat: 0  },
      { id: 'pro',        label: 'Gemini Advanced (Pro)', pricePerSeat: 19.99 },
      { id: 'business',   label: 'Google One AI Premium', pricePerSeat: 19.99 },
      { id: 'api',        label: 'API Direct',  pricePerSeat: 0,  notes: 'Pay-per-token; enter actual monthly spend' },
    ],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    category: 'coding',
    plans: [
      { id: 'free',       label: 'Free',        pricePerSeat: 0  },
      { id: 'pro',        label: 'Pro',         pricePerSeat: 15 },
      { id: 'teams',      label: 'Teams',       pricePerSeat: 30 },
      { id: 'enterprise', label: 'Enterprise',  pricePerSeat: 45, notes: 'Estimated floor' },
    ],
  },
];

export const TOOL_MAP = Object.fromEntries(TOOLS.map(t => [t.id, t])) as Record<ToolId, ToolInfo>;

export function getPlan(toolId: ToolId, planId: string): PlanInfo | undefined {
  return TOOL_MAP[toolId]?.plans.find(p => p.id === planId);
}

export function getToolName(toolId: ToolId): string {
  return TOOL_MAP[toolId]?.name ?? toolId;
}
