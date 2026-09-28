import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
}

export function Loader({ className }: LoaderProps) {
  return <Loader2 aria-hidden className={cn('h-4 w-4 animate-spin', className)} />;
}
