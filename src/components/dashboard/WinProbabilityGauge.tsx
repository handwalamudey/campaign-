import { cn } from '@/lib/utils';

interface WinProbabilityGaugeProps {
  probability: number;
}

export function WinProbabilityGauge({ probability }: WinProbabilityGaugeProps) {
  const getColor = () => {
    if (probability >= 60) return 'text-success';
    if (probability >= 45) return 'text-warning';
    return 'text-destructive';
  };

  const getStatusLabel = () => {
    if (probability >= 70) return 'Strong Position';
    if (probability >= 55) return 'Competitive';
    if (probability >= 45) return 'Toss-Up';
    return 'Challenging';
  };

  const getStatusBadge = () => {
    if (probability >= 60) return 'status-badge--success';
    if (probability >= 45) return 'status-badge--warning';
    return 'status-badge--danger';
  };

  // Calculate the circumference and offset for the circular progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="stat-card border-primary/30 flex flex-col items-center justify-center py-8">
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Estimated Win Probability
      </p>
      
      <div className="relative flex items-center justify-center">
        <svg className="h-48 w-48 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
            }}
          />
        </svg>
        
        <div className="absolute flex flex-col items-center">
          <span className={cn("text-5xl font-bold tracking-tight", getColor())}>
            {probability}%
          </span>
        </div>
      </div>

      <div className={cn("status-badge mt-4", getStatusBadge())}>
        {getStatusLabel()}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Based on current demographic data and field intelligence
      </p>
    </div>
  );
}
