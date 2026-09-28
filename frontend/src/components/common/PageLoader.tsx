import { Loader } from '@/components/ui/loader';

export function PageLoader() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader className="h-8 w-8 text-emerald-600" />
    </div>
  );
}
