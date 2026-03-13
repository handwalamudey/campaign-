import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaignStore } from '@/store/campaignStore';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';

const Mobilizers = () => {
  const { voters } = useCampaignStore();
  const navigate = useNavigate();

  const mobilizerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    let totalMobilized = 0;

    voters.forEach(v => {
      if (v.mobilizedBy && v.mobilizedBy.trim() !== '') {
        const name = v.mobilizedBy.trim();
        stats[name] = (stats[name] || 0) + 1;
        totalMobilized++;
      }
    });

    return Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      percentage: totalMobilized > 0 ? Math.round((count / totalMobilized) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [voters]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mobilizers
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Garissa Township Ward • Mobilizer Effectiveness
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mobilizerStats.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-border">
              No mobilizer data available.
            </div>
          ) : (
            mobilizerStats.map((mobilizer) => (
              <div 
                key={mobilizer.name}
                onClick={() => navigate(`/voters?view=list&mobilizedBy=${encodeURIComponent(mobilizer.name)}`)}
                className="stat-card cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between pb-2">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1" title={mobilizer.name}>
                    {mobilizer.name}
                  </h3>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
                
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {mobilizer.count}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      Voters Mobilized
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-success bg-success/10 px-2 py-1 rounded text-xs font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {mobilizer.percentage}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      of total
                    </p>
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

export default Mobilizers;
