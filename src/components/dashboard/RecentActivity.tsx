import { FieldReport } from '@/types/campaign';
import { MessageSquare, ThumbsUp, Minus, ThumbsDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  reports: FieldReport[];
}

const moodConfig = {
  positive: { icon: ThumbsUp, color: 'text-success', label: 'Positive' },
  neutral: { icon: Minus, color: 'text-warning', label: 'Neutral' },
  negative: { icon: ThumbsDown, color: 'text-destructive', label: 'Negative' },
};

export function RecentActivity({ reports }: RecentActivityProps) {
  const recentReports = reports
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  if (recentReports.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-sm font-medium">Recent Field Reports</h3>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No field reports yet.
          <br />
          Submit reports to track ground intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-sm font-medium">Recent Field Reports</h3>
      </div>

      <div className="mt-4 space-y-3">
        {recentReports.map((report, index) => {
          const mood = moodConfig[report.voterMood];
          const MoodIcon = mood.icon;
          
          return (
            <div
              key={report.id}
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {report.pollingStationName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {report.notes || 'No notes provided'}
                  </p>
                </div>
                <div className={cn("flex items-center gap-1", mood.color)}>
                  <MoodIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(report.submittedAt), { addSuffix: true })}
                </span>
                <span className="mx-1">•</span>
                <span>{report.submittedBy}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
