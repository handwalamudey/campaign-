import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaignStore } from '@/store/campaignStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, Target, AlertTriangle, Trophy } from 'lucide-react';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)'];

const Analytics = () => {
  const { demographics, fieldReports, getMetrics, stations } = useCampaignStore();
  const metrics = getMetrics();

  // Aggregate data by polling station
  const stationData = stations.map((station) => {
    const stationDemos = demographics.filter((d) => d.pollingStationId === station.id);
    const totalVoters = stationDemos.reduce((sum, d) => sum + d.estimatedVoters, 0);
    const avgSupport = stationDemos.length > 0
      ? stationDemos.reduce((sum, d) => sum + d.supportLevel, 0) / stationDemos.length
      : 50;
    const avgTurnout = stationDemos.length > 0
      ? stationDemos.reduce((sum, d) => sum + d.turnoutLikelihood, 0) / stationDemos.length
      : 65;

    return {
      name: station.name.split(' ').slice(0, 2).join(' '),
      fullName: station.name,
      voters: totalVoters,
      support: Math.round(avgSupport),
      turnout: Math.round(avgTurnout),
      registeredVoters: station.registeredVoters,
    };
  });


  // Aggregate by clan
  const clanMap = new Map<string, { voters: number; support: number; count: number }>();
  demographics.forEach((d) => {
    const current = clanMap.get(d.clan) || { voters: 0, support: 0, count: 0 };
    clanMap.set(d.clan, {
      voters: current.voters + d.estimatedVoters,
      support: current.support + d.supportLevel,
      count: current.count + 1,
    });
  });

  const clanData = Array.from(clanMap.entries()).map(([name, data]) => ({
    name,
    voters: data.voters,
    support: Math.round(data.support / data.count),
  }));

  // Mood distribution from field reports
  const moodCounts = {
    positive: fieldReports.filter((r) => r.voterMood === 'positive').length,
    neutral: fieldReports.filter((r) => r.voterMood === 'neutral').length,
    negative: fieldReports.filter((r) => r.voterMood === 'negative').length,
  };

  const moodData = [
    { name: 'Positive', value: moodCounts.positive, color: 'hsl(160, 84%, 39%)' },
    { name: 'Neutral', value: moodCounts.neutral, color: 'hsl(38, 92%, 50%)' },
    { name: 'Negative', value: moodCounts.negative, color: 'hsl(0, 72%, 51%)' },
  ].filter((d) => d.value > 0);

  // Find swing stations (support between 40-60%)
  const swingStations = stationData.filter((s) => s.support >= 40 && s.support <= 60);

  // Find turnout risks (turnout < 60%)
  const turnoutRisks = stationData.filter((s) => s.turnout < 60);

  // Find decisive combinations
  const decisiveCombinations = demographics
    .sort((a, b) => b.estimatedVoters - a.estimatedVoters)
    .slice(0, 3)
    .map((d) => ({
      station: d.pollingStationName,
      clan: d.clan,
      voters: d.estimatedVoters,
      support: d.supportLevel,
    }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data-driven analysis of campaign performance across demographics
          </p>
        </div>

        {/* Key Insights */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Swing Stations</p>
                <p className="text-2xl font-bold text-foreground">
                  {swingStations.length}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Stations where support is 40-60%
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turnout Risks</p>
                <p className="text-2xl font-bold text-foreground">
                  {turnoutRisks.length}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Stations with &lt;60% turnout likelihood
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive Reports</p>
                <p className="text-2xl font-bold text-foreground">
                  {moodCounts.positive}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {fieldReports.length > 0
                ? `${Math.round((moodCounts.positive / fieldReports.length) * 100)}% of field reports`
                : 'No reports yet'}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Coverage</p>
                <p className="text-2xl font-bold text-foreground">
                  {demographics.length}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Demographic entries recorded
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Trophy className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sports Engagement</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.footballClubPercentage}%
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Voters with football club data
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Support by Station */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Support Level by Polling Station
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stationData.some((s) => s.support > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="support" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Add demographic data to see charts
                </div>
              )}
            </CardContent>
          </Card>


          {/* Voter Mood Distribution */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Voter Mood from Field Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {moodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Submit field reports to see mood distribution
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clan Distribution */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Support by Clan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clanData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="support" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Avg Support %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Add demographic data to see clan analysis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Decisive Combinations */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Most Decisive Voter Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decisiveCombinations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {decisiveCombinations.map((combo, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {combo.station.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clan:</span>
                        <span className="font-medium">{combo.clan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Voters:</span>
                        <span className="font-medium">{combo.voters.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Support:</span>
                        <span className={cn(
                          "font-medium",
                          combo.support >= 60 ? "text-success" : combo.support >= 40 ? "text-warning" : "text-destructive"
                        )}>
                          {combo.support}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Add demographic data to identify decisive voter segments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          <p>
            <strong>Disclaimer:</strong> All analysis is based on estimates and should be used for strategic planning only.
            This tool does not predict actual election outcomes.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
