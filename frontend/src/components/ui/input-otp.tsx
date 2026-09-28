import { useRef, type ClipboardEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { OTP_LENGTH } from '@/constants/events';
import { cn } from '@/lib/utils';

interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires once when every box is filled (typing or paste). */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

const onlyDigits = (text: string) => text.replace(/\D/g, '');

export function InputOTP({
  value,
  onChange,
  onComplete,
  length = OTP_LENGTH,
  disabled,
  hasError,
  autoFocus = true,
}: InputOTPProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusBox = (index: number) => {
    const target = Math.min(Math.max(index, 0), length - 1);
    refs.current[target]?.focus();
    refs.current[target]?.select();
  };

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const digit = onlyDigits(event.target.value).slice(-1);
    const next = [...digits];
    next[index] = digit;
    commit(next.join(''));
    if (digit) focusBox(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Backspace': {
        event.preventDefault();
        const next = [...digits];
        if (digits[index]) {
          next[index] = '';
          onChange(next.join(''));
        } else if (index > 0) {
          next[index - 1] = '';
          onChange(next.join(''));
          focusBox(index - 1);
        }
        break;
      }
      case 'ArrowLeft':
        event.preventDefault();
        focusBox(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusBox(index + 1);
        break;
    }
  };

  // Pasting "123456" or "123-456" into ANY box fills boxes 1..6
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = onlyDigits(event.clipboardData.getData('text')).slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusBox(pasted.length >= length ? length - 1 : pasted.length);
  };

  return (
    <div role="group" aria-label="One-time verification code" className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="\d*"
          maxLength={2}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={hasError}
          className={cn(
            'h-12 w-10 rounded-xl border bg-white text-center text-xl font-semibold text-slate-900 sm:h-14 sm:w-12',
            'transition focus:outline-none focus:ring-4 disabled:opacity-60',
            hasError
              ? 'border-rose-400 focus:ring-rose-100'
              : digit
                ? 'border-emerald-500 bg-emerald-50/50 focus:ring-emerald-100'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100',
          )}
        />
      ))}
    </div>
  );
}
