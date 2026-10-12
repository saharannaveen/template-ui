import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  color?: 'default' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md';
}

const colorMap = {
  default: '',
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
};

const borderMap = {
  default: 'border-border',
  green: 'border-emerald-500/30',
  amber: 'border-amber-500/30',
  red: 'border-red-500/30',
};

export function StatTile({ label, value, unit, sublabel, color = 'default', size = 'md' }: StatTileProps) {
  const isSm = size === 'sm';
  return (
    <div className={cn(
      'rounded-lg border bg-card/50 backdrop-blur-sm transition-colors hover:bg-card/80',
      borderMap[color],
      isSm ? 'px-2.5 py-2' : 'px-3 py-2.5',
    )}>
      <p className={cn(
        'font-medium text-muted-foreground tracking-wider uppercase',
        isSm ? 'text-[9px]' : 'text-[10px]',
      )}>
        {label}
      </p>
      <p className={cn(
        'font-bold tabular-nums mt-0.5',
        colorMap[color] || 'text-foreground',
        isSm ? 'text-base' : 'text-lg',
      )}>
        {value}
        {unit && <span className={cn('font-normal text-muted-foreground ml-0.5', isSm ? 'text-[10px]' : 'text-xs')}>{unit}</span>}
      </p>
      {sublabel && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>}
    </div>
  );
}
