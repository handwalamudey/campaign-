import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DemographicEntry,
  FieldReport,
  CampaignMetrics,
  PollingStation,
  Voter
} from '@/types/campaign';

import { api } from '@/lib/api';

interface CampaignState {
  demographics: DemographicEntry[];
  fieldReports: FieldReport[];
  voters: Voter[];
  stations: PollingStation[];
  isLoading: boolean;
  error: string | null;
  fetchVoters: () => Promise<void>;
  deleteAllVoters: () => Promise<void>;
  fetchStations: () => Promise<void>;
  addStation: (station: Omit<PollingStation, 'id'>) => Promise<PollingStation>;
  deleteStation: (id: string) => Promise<void>;
  addDemographic: (entry: Omit<DemographicEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addDemographics: (entries: Omit<DemographicEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateDemographic: (id: string, entry: Partial<DemographicEntry>) => void;
  deleteDemographic: (id: string) => void;
  addFieldReport: (report: Omit<FieldReport, 'id' | 'submittedAt'>) => void;
  addVoter: (voter: Omit<Voter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVoter: (id: string, voter: Partial<Voter>) => Promise<void>;
  deleteVoter: (id: string) => Promise<void>;
  getMetrics: () => CampaignMetrics;
}

export const useCampaignStore = create<CampaignState>()(
  (set, get) => ({
    demographics: [],
    fieldReports: [],
    voters: [],
    stations: [],
    isLoading: false,
    error: null,

    fetchStations: async () => {
      set({ isLoading: true, error: null });
      try {
        const stations = await api.getStations();
        set({ stations, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    addStation: async (station) => {
      set({ isLoading: true, error: null });
      try {
        const newStation = await api.createStation(station);
        set((state) => ({
          stations: [...state.stations, newStation],
          isLoading: false
        }));
        return newStation;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    deleteStation: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await api.deleteStation(id);
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id),
          isLoading: false
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    fetchVoters: async () => {
      set({ isLoading: true, error: null });
      try {
        const voters = await api.getVoters();
        set({ voters, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    deleteAllVoters: async () => {
      set({ isLoading: true, error: null });
      try {
        await api.deleteAllVoters();
        set({ voters: [], isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    addDemographic: (entry) => {
      const newEntry: DemographicEntry = {
        ...entry,
        id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({ demographics: [...state.demographics, newEntry] }));
    },

    addDemographics: (entries) => {
      const newEntries: DemographicEntry[] = entries.map((entry, index) => ({
        ...entry,
        id: `demo-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      set((state) => ({ demographics: [...state.demographics, ...newEntries] }));
    },

    updateDemographic: (id, entry) => {
      set((state) => ({
        demographics: state.demographics.map((d) =>
          d.id === id ? { ...d, ...entry, updatedAt: new Date() } : d
        ),
      }));
    },

    deleteDemographic: (id) => {
      set((state) => ({
        demographics: state.demographics.filter((d) => d.id !== id),
      }));
    },

    addFieldReport: (report) => {
      const newReport: FieldReport = {
        ...report,
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
      };
      set((state) => ({ fieldReports: [...state.fieldReports, newReport] }));
    },

    addVoter: async (voter) => {
      set({ isLoading: true, error: null });
      try {
        const newVoter = await api.createVoter(voter);
        set((state) => ({
          voters: [...state.voters, newVoter],
          isLoading: false
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error; // Re-throw so component can handle it (e.g. show toast)
      }
    },

    updateVoter: async (id, voter) => {
      set({ isLoading: true, error: null });
      try {
        const updatedVoter = await api.updateVoter(id, voter);
        set((state) => ({
          voters: state.voters.map((v) =>
            v.id === id ? updatedVoter : v
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        throw error;
      }
    },

    deleteVoter: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await api.deleteVoter(id);
        set((state) => ({
          voters: state.voters.filter((v) => v.id !== id),
          isLoading: false
        }));
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    getMetrics: () => {
      const { voters, stations, fieldReports } = get();

      // 1. Total Registered Voters: Now based on actual captured voters
      // Note: If you want this to represent the Ward's total population, you'd use station.registeredVoters
      // But for a campaign CRM, it usually makes sense to track *our* captured voters.
      // However, if the user explicitly enters "2500" for a station capacity, we might want that.
      // Given the user feedback "in registered voter it says zero", they likely expect the count of people they added.
      // We'll calculate total from voters list + any manually set station capacities that are larger than voter counts?
      // Let's stick to voters.length as the primary "Registered in App" metric for now, 
      // or we can show "Captured Voters" vs "Total Ward Size".
      // User asked "Registered Voters". I will use voters.length for now as it's the specific complaint.
      const totalRegisteredVoters = voters.length;

      // 2. Win Probability & Support
      // Calculate based on individual voter status
      let totalSupportScore = 0;
      let totalTurnoutProb = 0;

      if (voters.length > 0) {
        voters.forEach((v) => {
          switch (v.status) {
            case 'confirmed':
              totalSupportScore += 100;
              totalTurnoutProb += 0.95;
              break;
            case 'likely':
              totalSupportScore += 75;
              totalTurnoutProb += 0.75;
              break;
            case 'undecided':
              totalSupportScore += 40; // Swing potential
              totalTurnoutProb += 0.5;
              break;
            case 'unlikely':
              totalSupportScore += 0;
              totalTurnoutProb += 0.1;
              break;
          }
        });
      }

      const avgSupport = voters.length > 0 ? totalSupportScore / voters.length : 50;

      // 3. Projected Turnout
      // Based on the probabilities assigned above
      const projectedTurnout = Math.round(totalTurnoutProb);
      const projectedTurnoutPercentage = voters.length > 0
        ? Math.round((projectedTurnout / voters.length) * 100)
        : 0;

      // 4. Sentiment Bonus from Field Reports
      const positiveReports = fieldReports.filter(r => r.voterMood === 'positive').length;
      const totalReports = fieldReports.length;
      const sentimentBonus = totalReports > 0 ? (positiveReports / totalReports) * 10 : 0;

      const winProbability = Math.min(95, Math.max(5, avgSupport + sentimentBonus));

      // 5. Categorize polling stations based on Voter data
      const stationMetrics = new Map<string, { supportScore: number; count: number }>();

      voters.forEach((v) => {
        const current = stationMetrics.get(v.pollingStationId) || { supportScore: 0, count: 0 };
        let score = 0;
        if (v.status === 'confirmed') score = 100;
        else if (v.status === 'likely') score = 75;
        else if (v.status === 'undecided') score = 40;

        stationMetrics.set(v.pollingStationId, {
          supportScore: current.supportScore + score,
          count: current.count + 1,
        });
      });

      const categorizedStations = stations.map((ps) => {
        const metrics = stationMetrics.get(ps.id);
        const count = metrics ? metrics.count : 0;
        const avgStationSupport = metrics && count > 0
          ? metrics.supportScore / count
          : 50; // Default to swing/neutral if no data

        let zoneType: PollingStation['zoneType'];
        if (avgStationSupport >= 65) zoneType = 'stronghold';
        else if (avgStationSupport >= 35) zoneType = 'swing';
        else zoneType = 'weak';

        // Override registeredVoters with the actual count of captured voters for accuracy in UI
        return { ...ps, zoneType, avgSupport: avgStationSupport, registeredVoters: Math.max(ps.registeredVoters, count) };
      });

      const strongholds = categorizedStations.filter(s => s.zoneType === 'stronghold').sort((a, b) => b.registeredVoters - a.registeredVoters);
      const swingZones = categorizedStations.filter(s => s.zoneType === 'swing').sort((a, b) => b.registeredVoters - a.registeredVoters);
      const weakZones = categorizedStations.filter(s => s.zoneType === 'weak').sort((a, b) => b.registeredVoters - a.registeredVoters);
 
      const townshipVoters = voters.filter(v => v.ward?.trim().toLowerCase() === 'township').length;
      const nrVoters = voters.filter(v => v.ward?.trim().toLowerCase() === 'nr').length;
      const otherVoters = voters.length - (townshipVoters + nrVoters);

      // High risk = swing zones with high voter count but low/undefined support? 
      // Or simply weak zones?
      const highRiskStations = categorizedStations
        .filter(s => s.zoneType === 'swing' || s.zoneType === 'weak')
        .sort((a, b) => b.registeredVoters - a.registeredVoters) // Prioritize larger stations Focus
        .slice(0, 3);
 
      const votersWithFootballClub = voters.filter(v => v.footballClub && v.footballClub.trim() !== '').length;
      const footballClubPercentage = voters.length > 0
        ? Math.round((votersWithFootballClub / voters.length) * 100)
        : 0;
 
      const mobilizedVoters = voters.filter(v => v.mobilizedBy && v.mobilizedBy.trim() !== '').length;
      const mobilizedPercentage = voters.length > 0
        ? Math.round((mobilizedVoters / voters.length) * 100)
        : 0;
 
      return {
        winProbability: Math.round(winProbability),
        totalRegisteredVoters,
        projectedTurnout,
        projectedTurnoutPercentage,
        highRiskStations,
        strongholds,
        swingZones,
        weakZones,
        footballClubPercentage,
        mobilizedPercentage,
        townshipVoters,
        nrVoters,
        otherVoters,
      };
    },
  })
);
