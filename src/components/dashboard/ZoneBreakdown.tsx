import { PollingStation } from '@/types/campaign';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ZoneBreakdownProps {
  townshipVoters: number;
  nrVoters: number;
  otherVoters: number;
}

export function ZoneBreakdown({ townshipVoters, nrVoters, otherVoters }: ZoneBreakdownProps) {
  const navigate = useNavigate();

  const zones = [
    {
      label: 'Township Voters',
      value: townshipVoters,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      description: 'Voters registered in Township Ward',
      category: 'township'
    },
    {
      label: 'NR Voters',
      value: nrVoters,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      description: 'Voters marked as NR',
      category: 'nr'
    },
    {
      label: 'Other Voters',
      value: otherVoters,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      description: 'Voters in non-Township, non-NR wards',
      category: 'others'
    },
  ];

  return (
    <div className="stat-card">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Ward Breakdown
      </h3>
      
      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.label}
            onClick={() => navigate(`/voters?view=list&ward=${zone.category}`)}
            className={cn(
              "rounded-lg border p-4 transition-all duration-200 hover:shadow-md cursor-pointer relative z-10",
              zone.borderColor,
              zone.bgColor
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", zone.bgColor)}>
                <zone.icon className={cn("h-5 w-5", zone.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={cn("font-medium", zone.color)}>
                    {zone.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {zone.value.toLocaleString()} voters
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {zone.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
