import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast, type ToastVariant } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const STYLES: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'border-emerald-200 text-emerald-600' },
  error: { icon: XCircle, classes: 'border-rose-200 text-rose-600' },
  info: { icon: Info, classes: 'border-sky-200 text-sky-600' },
};

export function Toaster() {
  const { toasts, toast } = useToast();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
    >
      {toasts.map((item) => {
        const { icon: Icon, classes } = STYLES[item.variant];
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full animate-fade-in-up items-start gap-3 rounded-xl border bg-white p-4 shadow-lg',
              classes,
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-900">{item.title}</p>
              {item.description && <p className="mt-0.5 text-slate-600">{item.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
