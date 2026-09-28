import { memo } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/formatters';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' } as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export const Avatar = memo(function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 font-semibold text-white',
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
});
