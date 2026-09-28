import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full space-y-1.5">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error || hint ? messageId : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400',
              'transition focus:outline-none focus:ring-4',
              leftIcon && 'pl-10',
              rightElement && 'pr-11',
              error
                ? 'border-rose-400 focus:ring-rose-100'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
              className,
            )}
            {...props}
          />
          {rightElement && <div className="absolute inset-y-0 right-2 flex items-center">{rightElement}</div>}
        </div>
        {error ? (
          <p id={messageId} role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        ) : (
          hint && (
            <p id={messageId} className="text-xs text-slate-500">
              {hint}
            </p>
          )
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
