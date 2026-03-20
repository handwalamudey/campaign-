import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaignStore } from '@/store/campaignStore';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Group } from 'lucide-react';
import { cn } from '@/lib/utils';

const Clans = () => {
  const { voters } = useCampaignStore();
  const navigate = useNavigate();

  const clanStats = useMemo(() => {
    const stats: Record<string, { voters: number; mobilizers: Set<string> }> = {};

    voters.forEach(v => {
      const clanName = v.clan?.trim() || v.tribe?.trim() || 'Other';
      if (!stats[clanName]) {
        stats[clanName] = { voters: 0, mobilizers: new Set() };
      }
      stats[clanName].voters += 1;
      if (v.mobilizedBy && v.mobilizedBy.trim() !== '') {
        stats[clanName].mobilizers.add(v.mobilizedBy.trim());
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      voterCount: data.voters,
      mobilizerCount: data.mobilizers.size,
    })).sort((a, b) => b.voterCount - a.voterCount);
  }, [voters]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Clans
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Garissa Township Ward • Clan breakdown and mobilizer engagement
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clanStats.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-border">
              No clan data available.
            </div>
          ) : (
            clanStats.map((clan) => (
              <div 
                key={clan.name}
                onClick={() => navigate(`/voters?view=list&clan=${encodeURIComponent(clan.name)}`)}
                className="stat-card cursor-pointer hover:border-primary/50 transition-colors bg-card p-6 rounded-xl border border-border shadow-sm"
              >
                <div className="flex items-center justify-between pb-4">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1" title={clan.name}>
                    {clan.name}
                  </h3>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Group className="h-5 w-5 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {clan.voterCount}
                      </p>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      Total Voters
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-semibold text-foreground">
                          {clan.mobilizerCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Active Mobilizers</p>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-success" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Clans;
