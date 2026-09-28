import { memo, useMemo } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RULES = [
  { id: 'length', label: '8+ characters', test: (v: string) => v.length >= 8 },
  { id: 'upper', label: 'Uppercase', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Lowercase', test: (v: string) => /[a-z]/.test(v) },
  { id: 'number', label: 'Number', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'Special char', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

const BAR_COLORS = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500', 'bg-emerald-500'];

export const PasswordStrength = memo(function PasswordStrength({ password }: { password: string }) {
  const results = useMemo(() => RULES.map((rule) => ({ ...rule, passed: rule.test(password) })), [password]);
  const score = results.filter((r) => r.passed).length;

  if (!password) return null;

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {RULES.map((rule, i) => (
          <span
            key={rule.id}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', i < score ? BAR_COLORS[score] : 'bg-slate-200')}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {results.map((r) => (
          <li
            key={r.id}
            className={cn('flex items-center gap-1 text-xs', r.passed ? 'text-emerald-600' : 'text-slate-400')}
          >
            {r.passed ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
});
