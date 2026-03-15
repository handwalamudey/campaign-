
export type VoterMood = 'positive' | 'neutral' | 'negative';

export type ZoneType = 'stronghold' | 'swing' | 'weak';

export type VoterStatus = 'confirmed' | 'likely' | 'undecided' | 'unlikely';

export interface Voter {
  id: string;
  name: string;
  idNumber: string;
  phoneNumber?: string;
  clan: string;
  pollingStationId: string;
  pollingStationName: string;
  location: string;
  dob?: number;
  rG?: boolean;
  supportProbability?: number;
  footballClub?: string;
  tribe?: string;
  ward?: string;
  pollingCenter?: string;
  stream?: string;
  mobilizedBy?: string;
  status: VoterStatus;
  notes?: string;
  optedIn?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollingStation {
  id: string;
  name: string;
  registeredVoters: number;
  zoneType: ZoneType;
}

export interface VoterMessage {
  id: string;
  voter: string;
  channel: 'sms' | 'whatsapp';
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'failed' | 'read';
  external_id?: string;
  created_at: string;
}

export interface DemographicEntry {
  id: string;
  pollingStationId: string;
  pollingStationName: string;
  clan: string;
  estimatedVoters: number;
  supportLevel: number;
  turnoutLikelihood: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldReport {
  id: string;
  pollingStationId: string;
  pollingStationName: string;
  dominantClan: string;
  rallyAttendanceEstimate: number;
  voterMood: VoterMood;
  notes: string;
  submittedBy: string;
  submittedAt: Date;
}

export interface CampaignMetrics {
  winProbability: number;
  totalRegisteredVoters: number;
  projectedTurnout: number;
  projectedTurnoutPercentage: number;
  highRiskStations: PollingStation[];
  strongholds: PollingStation[];
  swingZones: PollingStation[];
  weakZones: PollingStation[];
  footballClubPercentage: number;
  mobilizedPercentage: number;
  townshipVoters: number;
  nrVoters: number;
  otherVoters: number;
}

export interface PollingStationAnalysis {
  pollingStation: PollingStation;
  totalVoters: number;
  projectedSupport: number;
  turnoutRisk: 'low' | 'medium' | 'high';
  dominantClan: string;
  recommendation: string;
}

export const CLANS = [
  'Ogaden',
  'Abdalla',
  'Aulihan',
  'Abdwak',
  'Fai',
  'Other'
] as const;


export const POLLING_STATIONS: PollingStation[] = [];
