import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
        <Eye className="h-5 w-5" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          Sleep<span className="text-brand-500">Alarm</span>
        </span>
      )}
    </div>
  );
}
