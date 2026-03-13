import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'border-border',
  primary: 'border-primary/30 shadow-glow',
  warning: 'border-warning/30',
  danger: 'border-destructive/30',
};

const trendStyles = {
  up: { icon: TrendingUp, color: 'text-success' },
  down: { icon: TrendingDown, color: 'text-destructive' },
  neutral: { icon: Minus, color: 'text-muted-foreground' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const TrendIcon = trend ? trendStyles[trend].icon : null;
  const trendColor = trend ? trendStyles[trend].color : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'stat-card',
        variantStyles[variant],
        onClick && "cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            variant === 'primary' && "glow-text"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-muted p-2.5">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && TrendIcon && (
        <div className={cn("mt-4 flex items-center gap-1.5 text-sm", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
