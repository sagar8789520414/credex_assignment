import type { FormState, AuditResult } from '@/types';

const FORM_KEY = 'asa_form_state';
const FORM_VERSION = 'v2'; // bump this to invalidate old cached form state
const AUDITS_KEY = 'asa_audits';

export function saveFormState(state: FormState): void {
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify({ ...state, _v: FORM_VERSION }));
  } catch {
    // Ignore storage errors — storage may be unavailable
  }
}

export function loadFormState(): FormState | null {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Invalidate state from older versions
    if (parsed._v !== FORM_VERSION) {
      localStorage.removeItem(FORM_KEY);
      return null;
    }
    return parsed as FormState;
  } catch {
    // Ignore parse errors — return null
    return null;
  }
}

export function saveAudit(audit: AuditResult): void {
  // Save locally
  try {
    const existing = loadAllAudits();
    existing[audit.id] = audit;
    localStorage.setItem(AUDITS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage errors — may be unavailable
  }

  // Persist to backend so share links work across devices
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (!apiUrl) {
    console.warn('[storage] VITE_API_URL not set — share links will only work on this device');
    return;
  }

  fetch(`${apiUrl}/api/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(audit),
  }).catch((err) => {
    console.error('[storage] Failed to persist audit to backend:', err);
    // Non-fatal — local storage still works for same-browser access
  });
}

export function loadAudit(id: string): AuditResult | null {
  try {
    const all = loadAllAudits();
    return all[id] ?? null;
  } catch {
    return null;
  }
}

export async function loadAuditRemote(id: string): Promise<AuditResult | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/audits/${id}`);
    if (!res.ok) return null;
    return await res.json() as AuditResult;
  } catch {
    return null;
  }
}

function loadAllAudits(): Record<string, AuditResult> {
  try {
    const raw = localStorage.getItem(AUDITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
