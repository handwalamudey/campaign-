import { PollingStation } from '@/types/campaign';
import { AlertCircle, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighRiskStationsProps {
  stations: PollingStation[];
}

export function HighRiskStations({ stations }: HighRiskStationsProps) {
  if (stations.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-sm font-medium">High-Risk Stations</h3>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No high-risk stations identified yet.
          <br />
          Add demographic data to see risk analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card border-destructive/30">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <h3 className="text-sm font-medium text-muted-foreground">
          High-Risk Stations
        </h3>
      </div>
      
      <div className="mt-4 space-y-3">
        {stations.map((station, index) => (
          <div
            key={station.id}
            className={cn(
              "flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <MapPin className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {station.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{station.registeredVoters.toLocaleString()} voters</span>
                </div>
              </div>
            </div>
            <span className={cn(
              "status-badge",
              station.zoneType === 'weak' ? 'status-badge--danger' : 'status-badge--warning'
            )}>
              {station.zoneType}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        These stations require immediate attention and targeted outreach.
      </p>
    </div>
  );
}
