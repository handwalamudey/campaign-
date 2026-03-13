import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { WinProbabilityGauge } from '@/components/dashboard/WinProbabilityGauge';
import { ZoneBreakdown } from '@/components/dashboard/ZoneBreakdown';
import { HighRiskStations } from '@/components/dashboard/HighRiskStations';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RecentVoters } from '@/components/dashboard/RecentVoters';
import { useCampaignStore } from '@/store/campaignStore';
import { useNavigate } from 'react-router-dom';
import { Users, Vote, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { getMetrics, fieldReports, voters } = useCampaignStore();
  const metrics = getMetrics();

  const libraryVoters = voters.filter(v => v.pollingCenter?.trim().toLowerCase() === 'library' || v.pollingStationName?.trim().toLowerCase() === 'library').length;
  const chiefCampVoters = voters.filter(v => v.pollingCenter?.trim().toLowerCase() === 'chief camp' || v.pollingStationName?.trim().toLowerCase() === 'chief camp').length;
  const garissaCulturalCentreVoters = voters.filter(v => v.pollingCenter?.trim().toLowerCase() === 'garissa cultural centre' || v.pollingStationName?.trim().toLowerCase() === 'garissa cultural centre').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Campaign Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Garissa Township Ward • MCA Campaign Intelligence
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Registered Voters"
            value={metrics.totalRegisteredVoters.toLocaleString()}
            subtitle="Ward total"
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            onClick={() => navigate('/voters?view=list')}
          />
          <StatCard
            title="Library Station"
            value={libraryVoters.toLocaleString()}
            subtitle="Registered voters"
            icon={<Vote className="h-5 w-5 text-muted-foreground" />}
            onClick={() => navigate('/voters?view=list&pollingCenter=Library')}
          />
          <StatCard
            title="Chief Camp"
            value={chiefCampVoters.toLocaleString()}
            subtitle="Registered voters"
            icon={<Vote className="h-5 w-5 text-success" />}
            variant="primary"
            onClick={() => navigate('/voters?view=list&pollingCenter=Chief+Camp')}
          />
          <StatCard
            title="Cultural Centre"
            value={garissaCulturalCentreVoters.toLocaleString()}
            subtitle="Registered voters"
            icon={<Vote className="h-5 w-5 text-warning" />}
            variant="warning"
            onClick={() => navigate('/voters?view=list&pollingCenter=Garissa+Cultural+Centre')}
          />
          <StatCard
            title="Sports Engagement"
            value={`${metrics.footballClubPercentage}%`}
            subtitle="Football club coverage"
            icon={<Trophy className="h-5 w-5 text-orange-500" />}
            onClick={() => navigate('/voters?view=list&footballClub=true')}
          />
          <StatCard
            title="Mobilized"
            value={`${metrics.mobilizedPercentage}%`}
            subtitle="Mobilized coverage"
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            onClick={() => navigate('/mobilizers')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Win Probability - Center Focus */}
          <div className="lg:col-span-1">
            <WinProbabilityGauge probability={metrics.winProbability} />
          </div>

          {/* Zone Breakdown */}
          <div className="lg:col-span-1">
            <ZoneBreakdown
              townshipVoters={metrics.townshipVoters}
              nrVoters={metrics.nrVoters}
              otherVoters={metrics.otherVoters}
            />
          </div>

          {/* High Risk Stations */}
          <div className="lg:col-span-1">
            <HighRiskStations stations={metrics.highRiskStations} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6">
          <RecentVoters voters={voters} />
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> All numbers are estimates based on available data.
            This tool is for internal campaign strategy only.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
