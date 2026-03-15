import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaignStore } from '@/store/campaignStore';
import { CLANS, VoterMood } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Send,
  FileText,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Clock,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

const moodConfig = {
  positive: { icon: ThumbsUp, color: 'text-success', bgColor: 'bg-success/10' },
  neutral: { icon: Minus, color: 'text-warning', bgColor: 'bg-warning/10' },
  negative: { icon: ThumbsDown, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

const FieldReports = () => {
  const { fieldReports, addFieldReport, stations } = useCampaignStore();

  const [formData, setFormData] = useState({
    pollingStationId: '',
    dominantClan: '',
    rallyAttendanceEstimate: '',
    voterMood: '' as VoterMood | '',
    notes: '',
    submittedBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pollingStationId || !formData.voterMood || !formData.submittedBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    const station = stations.find(ps => ps.id === formData.pollingStationId);

    addFieldReport({
      pollingStationId: formData.pollingStationId,
      pollingStationName: station?.name || '',
      dominantClan: formData.dominantClan,
      rallyAttendanceEstimate: parseInt(formData.rallyAttendanceEstimate) || 0,
      voterMood: formData.voterMood as VoterMood,
      notes: formData.notes,
      submittedBy: formData.submittedBy,
    });

    toast.success('Field report submitted successfully');

    setFormData({
      pollingStationId: '',
      dominantClan: '',
      rallyAttendanceEstimate: '',
      voterMood: '',
      notes: '',
      submittedBy: '',
    });
  };

  const sortedReports = [...fieldReports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Field Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit and view ground intelligence from field agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {fieldReports.length} reports
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Submit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="stat-card sticky top-6">
              <h3 className="mb-6 text-lg font-semibold text-foreground">
                Submit Field Report
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pollingStation">Polling Station *</Label>
                  <Select
                    value={formData.pollingStationId}
                    onValueChange={(value) => setFormData({ ...formData, pollingStationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dominantClan">Dominant Clan</Label>
                    <Select
                      value={formData.dominantClan}
                      onValueChange={(value) => setFormData({ ...formData, dominantClan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select clan" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLANS.map((clan) => (
                          <SelectItem key={clan} value={clan}>
                            {clan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rallyAttendance">Rally Attendance Estimate</Label>
                  <Input
                    id="rallyAttendance"
                    type="number"
                    placeholder="e.g., 250"
                    value={formData.rallyAttendanceEstimate}
                    onChange={(e) => setFormData({ ...formData, rallyAttendanceEstimate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Voter Mood *</Label>
                  <div className="flex gap-2">
                    {(['positive', 'neutral', 'negative'] as VoterMood[]).map((mood) => {
                      const config = moodConfig[mood];
                      const Icon = config.icon;
                      const isSelected = formData.voterMood === mood;

                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setFormData({ ...formData, voterMood: mood })}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                            isSelected
                              ? `${config.bgColor} border-current ${config.color}`
                              : "border-border bg-muted/20 hover:bg-muted/40"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", isSelected ? config.color : "text-muted-foreground")} />
                          <span className="text-xs font-medium capitalize">{mood}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observations, notable interactions, concerns..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submittedBy">Your Name *</Label>
                  <Input
                    id="submittedBy"
                    placeholder="Field agent name"
                    value={formData.submittedBy}
                    onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Submit Report
                </Button>
              </div>
            </form>
          </div>

          {/* Reports List */}
          <div className="lg:col-span-3">
            <div className="stat-card overflow-hidden p-0">
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <h3 className="font-semibold text-foreground">Recent Reports</h3>
              </div>

              {sortedReports.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No field reports yet.</p>
                  <p className="text-sm">Submit your first report using the form.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedReports.map((report) => {
                    const mood = moodConfig[report.voterMood];
                    const MoodIcon = mood.icon;

                    return (
                      <div key={report.id} className="p-4 hover:bg-muted/20">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                {report.pollingStationName}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-md bg-muted px-2 py-0.5">
                                {report.dominantClan}
                              </span>
                              <span className="rounded-md bg-muted px-2 py-0.5">
                              </span>
                              {report.rallyAttendanceEstimate > 0 && (
                                <span className="rounded-md bg-muted px-2 py-0.5">
                                  ~{report.rallyAttendanceEstimate} at rally
                                </span>
                              )}
                            </div>

                            {report.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {report.notes}
                              </p>
                            )}

                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(report.submittedAt), { addSuffix: true })}
                              </span>
                              <span>by {report.submittedBy}</span>
                            </div>
                          </div>

                          <div className={cn("rounded-lg p-2", mood.bgColor)}>
                            <MoodIcon className={cn("h-5 w-5", mood.color)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FieldReports;
