import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  auditId: string;
  onClose: () => void;
}

interface LeadForm {
  email: string;
  companyName: string;
  role: string;
  teamSize: string;
  // honeypot — must stay empty
  website: string;
}

const RATE_LIMIT_KEY = 'asa_lead_submitted';
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

export default function LeadCaptureModal({ auditId, onClose }: Props) {
  const [form, setForm] = useState<LeadForm>({
    email: '', companyName: '', role: '', teamSize: '', website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof LeadForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check
    if (form.website) return;

    // Client-side rate limit
    const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
    if (lastSubmit && Date.now() - Number(lastSubmit) < RATE_LIMIT_MS) {
      setError('Please wait a moment before submitting again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          companyName: form.companyName || undefined,
          role: form.role || undefined,
          teamSize: form.teamSize ? Number(form.teamSize) : undefined,
          auditId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Submission failed');
      }

      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h2 id="modal-title" className="font-bold text-zinc-900 text-lg">Get your full report</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-900 text-lg mb-2">Report on its way!</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Check your inbox. If your savings are significant, our team will reach out about Credex credits.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Honeypot — hidden from real users */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={e => update('website', e.target.value)}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
            />

            <div className="space-y-2">
              <Label htmlFor="email">Work email *</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                value={form.companyName}
                onChange={e => update('companyName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Your role</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="CTO, EM, Founder…"
                  value={form.role}
                  onChange={e => update('role', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTeamSize">Team size</Label>
                <Input
                  id="leadTeamSize"
                  type="number"
                  min={1}
                  placeholder="10"
                  value={form.teamSize}
                  onChange={e => update('teamSize', e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send me the report'}
            </Button>

            <p className="text-xs text-zinc-400 text-center">
              No spam. Unsubscribe anytime. High-savings cases may receive a Credex outreach.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
