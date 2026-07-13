import { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  'aria-label'?: string;
}

/**
 * Accessible custom checkbox. The native control is styled with `appearance-none`
 * so it stays clearly visible in dark mode (a plain native checkbox renders as a
 * faint dark-on-dark box). Shows a check when selected and a dash when indeterminate.
 */
export function Checkbox({ checked, indeterminate = false, onChange, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border-2 border-slate-300 bg-white transition checked:border-brand-600 checked:bg-brand-600 indeterminate:border-brand-600 indeterminate:bg-brand-600 hover:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-slate-500 dark:bg-white/10"
        {...rest}
      />
      <span className="pointer-events-none absolute text-white">
        {indeterminate ? <Minus className="h-3 w-3" strokeWidth={3} /> : checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </span>
  );
}
