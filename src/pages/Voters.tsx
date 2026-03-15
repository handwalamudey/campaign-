import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCampaignStore } from '@/store/campaignStore';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageModal } from '@/components/voters/MessageModal';
import { ConversationWindow } from '@/components/voters/ConversationWindow';
import {
  MessageSquare,
  Send,
  MessageCircle,
  UserPlus,
  Users,
  Search,
  Check,
  X,
  Trash2,
  Trophy,
  Pencil,
  Undo2
} from 'lucide-react';
import { Voter, VoterStatus } from '@/types/campaign';
import { api } from '@/lib/api';

const VOTER_STATUSES: { value: VoterStatus; label: string; color: string }[] = [
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500/20 text-green-400' },
  { value: 'likely', label: 'Likely', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'undecided', label: 'Undecided', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'unlikely', label: 'Unlikely', color: 'bg-red-500/20 text-red-400' },
];

export default function Voters() {
  const { isSidebarCollapsed } = useUIStore();
  const [searchParams] = useSearchParams();
  const isListView = searchParams.get('view') === 'list';
  const { voters, stations, addVoter, deleteVoter, addStation, fetchVoters, deleteAllVoters, isLoading, error } = useCampaignStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClan, setFilterClan] = useState<string>('all');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [filterFootballClub, setFilterFootballClub] = useState<boolean>(searchParams.get('footballClub') === 'true');
  const [filterPollingCenter, setFilterPollingCenter] = useState<string | null>(searchParams.get('pollingCenter'));
  const [filterMobilizedBy, setFilterMobilizedBy] = useState<string | null>(searchParams.get('mobilizedBy'));
  const [filterWard, setFilterWard] = useState<string | null>(searchParams.get('ward'));

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVoterId, setEditingVoterId] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(true);

  const displayOrBlank = (value: string | number | null | undefined) =>
    (value === null || value === undefined || value === '' || String(value).toLowerCase() === 'nr') ? 'NR' : String(value);

  const getVoterPriority = (voter: Voter) => {
    const ward = (voter.ward || '').trim().toLowerCase();
    const isTownship = ward === 'township';
    const isWardNR = ward === 'nr'; // rows where Ward column literally shows "NR"
    const hasRealWard = ward.length > 0 && !isTownship && !isWardNR;

    // 1) Township ward (any registration) - always first
    if (isTownship) return 0;
    // 2) Rows whose Ward is literally "NR" (your "NR with no ward name")
    if (isWardNR) return 1;
    // 3) Other wards with a real ward name (non-Township, non-"NR")
    if (hasRealWard) return 2;
    // 4) Blank ward rows (any registration) - always last
    return 3;
  };

  useEffect(() => {
    // Ensure we always load voters (including any created via bulk upload from elsewhere)
    fetchVoters();
  }, [fetchVoters]);

  useEffect(() => {
    if (error) {
      toast.error(`Error loading data: ${error}`);
    }
  }, [error]);

  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phoneNumber: '',
    dob: '' as string | number,
    rG: false,
    footballClub: '',
    tribe: '',
    ward: '',
    pollingCenter: '',
    stream: '',
    mobilizedBy: '',
    // Hidden/internal fields kept for backend compatibility
    clan: '',
    pollingStationName: '',
    location: '',
    status: 'undecided' as VoterStatus,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.idNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Logic for determining station and other key fields
      const tribe = formData.tribe || '';
      const clan = formData.clan || tribe || 'N/A';
      
      const pollingStationName = (formData.pollingStationName || formData.pollingCenter || 'GENERAL').trim();
      const location = formData.location || 'N/A';

      let stationId = '';
      const existingStation = stations.find(
        s => s.name.toLowerCase() === pollingStationName.toLowerCase()
      );

      if (existingStation) {
        stationId = existingStation.id;
      } else {
        const newStation = await addStation({
          name: pollingStationName,
          registeredVoters: 0,
          zoneType: 'swing',
        });
        stationId = newStation.id;
        toast.success(`Created new polling station: ${newStation.name}`);
      }

      const voterPayload = {
        name: formData.name,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber || undefined,
        dob: formData.dob ? Number(formData.dob) : undefined,
        rG: Boolean(formData.rG),
        footballClub: formData.footballClub || undefined,
        tribe: formData.tribe || undefined,
        ward: formData.ward || undefined,
        pollingCenter: formData.pollingCenter || undefined,
        stream: formData.stream || undefined,
        mobilizedBy: formData.mobilizedBy || undefined,
        clan,
        pollingStationId: stationId,
        pollingStationName,
        location,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      if (isEditing && editingVoterId) {
        const updateVoter = useCampaignStore.getState().updateVoter;
        await updateVoter(editingVoterId, voterPayload);
        toast.success('Voter updated successfully');
      } else {
        await addVoter(voterPayload);
        toast.success('Voter added successfully');
      }

      setFormData({
        name: '',
        idNumber: '',
        phoneNumber: '',
        dob: '',
        rG: false,
        footballClub: '',
        tribe: '',
        ward: '',
        pollingCenter: '',
        stream: '',
        mobilizedBy: '',
        clan: '',
        pollingStationName: '',
        location: '',
        status: 'undecided',
        notes: '',
      });
      setIsEditing(false);
      setEditingVoterId(null);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update voter' : 'Failed to add voter');
    }
  };

  const filteredVoters = voters
    .filter((voter) => {
      const matchesSearch =
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClan = filterClan === 'all' || voter.clan === filterClan;
      const matchesStation = filterStation === 'all' || voter.pollingStationId === filterStation;
      const matchesFootballClub = filterFootballClub
        ? !!voter.footballClub && voter.footballClub !== 'NR' && voter.footballClub !== 'N/A' && voter.footballClub.trim() !== ''
        : true;
      const matchesPollingCenter = filterPollingCenter
        ? (voter.pollingCenter?.trim().toLowerCase() === filterPollingCenter.toLowerCase() || voter.pollingStationName?.trim().toLowerCase() === filterPollingCenter.toLowerCase())
        : true;
      const matchesMobilizedBy = filterMobilizedBy
        ? voter.mobilizedBy?.trim().toLowerCase() === filterMobilizedBy.toLowerCase()
        : true;
      const matchesWard = !filterWard || (
        filterWard.toLowerCase() === 'township'
          ? (voter.ward?.trim().toLowerCase() === 'township')
          : filterWard.toLowerCase() === 'nr'
            ? (voter.ward?.trim().toLowerCase() === 'nr')
            : filterWard.toLowerCase() === 'others'
              ? (voter.ward?.trim().toLowerCase() !== 'township' && voter.ward?.trim().toLowerCase() !== 'nr')
              : true
      );

      return matchesSearch && matchesClan && matchesStation && matchesFootballClub && matchesPollingCenter && matchesMobilizedBy && matchesWard;
    })
    .sort((a, b) => getVoterPriority(a) - getVoterPriority(b));

  const getStatusBadge = (status: VoterStatus) => {
    const statusConfig = VOTER_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voter Registry</h1>
          <p className="text-muted-foreground">
            Track individual voters with their clan, ID, and location
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Voter Form */}
          {!isListView && showAddForm && (
            <Card className="lg:col-span-1 animate-scale-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    {isEditing ? 'Edit Voter' : 'Add Voter'}
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? `Updating details for ${formData.name}` : 'Register a new voter'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAddForm(false)}
                  title="Dismiss form"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter voter's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="e.g., 12345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Birth Year</Label>
                    <Input
                      id="dob"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      placeholder="e.g., 1990"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="rG"
                      checked={formData.rG}
                      onCheckedChange={(checked) => setFormData({ ...formData, rG: checked as boolean })}
                    />
                    <Label
                      htmlFor="rG"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Registered Voter
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="e.g., 0712345678"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footballClub">Football Club</Label>
                      <Input
                        id="footballClub"
                        value={formData.footballClub}
                        onChange={(e) => setFormData({ ...formData, footballClub: e.target.value })}
                        placeholder="e.g., COMMANDOS"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tribe">Tribe</Label>
                      <Input
                        id="tribe"
                        value={formData.tribe}
                        onChange={(e) => setFormData({ ...formData, tribe: e.target.value })}
                        placeholder="e.g., Murule"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clan">Clan</Label>
                      <Input
                        id="clan"
                        value={formData.clan}
                        onChange={(e) => setFormData({ ...formData, clan: e.target.value })}
                        placeholder="Enter clan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stream">Stream</Label>
                      <Input
                        id="stream"
                        value={formData.stream}
                        onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                        placeholder="e.g., 1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ward">Ward</Label>
                      <Input
                        id="ward"
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        placeholder="e.g., Township"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pollingCenter">Polling Center</Label>
                    <Input
                      id="pollingCenter"
                      value={formData.pollingCenter}
                      onChange={(e) => setFormData({ ...formData, pollingCenter: e.target.value })}
                      placeholder="e.g., Library"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobilizedBy">Mobilized By</Label>
                    <Input
                      id="mobilizedBy"
                      value={formData.mobilizedBy}
                      onChange={(e) => setFormData({ ...formData, mobilizedBy: e.target.value })}
                      placeholder="e.g., Anwar"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Extra information"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {isEditing ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Update Voter
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Voter
                        </>
                      )}
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingVoterId(null);
                          setFormData({
                            name: '',
                            idNumber: '',
                            phoneNumber: '',
                            dob: '',
                            rG: false,
                            footballClub: '',
                            tribe: '',
                            ward: '',
                            pollingCenter: '',
                            stream: '',
                            mobilizedBy: '',
                            clan: '',
                            pollingStationName: '',
                            location: '',
                            status: 'undecided',
                            notes: '',
                          });
                        }}
                      >
                        <Undo2 className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Voters List */}
          <Card className={cn("transition-all duration-300", (isListView || !showAddForm) ? "lg:col-span-3" : "lg:col-span-2")}>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Registered Voters
                  </CardTitle>
                  <CardDescription>{voters.length} total voters</CardDescription>
                </div>
                {!showAddForm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                    size="sm"
                    className="w-fit"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register New Voter
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterClan} onValueChange={setFilterClan}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by clan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clans</SelectItem>
                    {Array.from(new Set(voters.map(v => v.clan))).filter(Boolean).sort().map((clan) => (
                      <SelectItem key={clan} value={clan}>
                        {clan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStation} onValueChange={setFilterStation}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={filterFootballClub ? "default" : "outline"}
                  onClick={() => setFilterFootballClub(!filterFootballClub)}
                  className="whitespace-nowrap"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  {filterFootballClub ? "Sports Only" : "All Voters"}
                </Button>
                {filterPollingCenter && (
                  <Button
                    variant="outline"
                    onClick={() => setFilterPollingCenter(null)}
                    className="whitespace-nowrap"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear '{filterPollingCenter}' Filter
                  </Button>
                )}
                {filterMobilizedBy && (
                  <Button
                    variant="outline"
                    onClick={() => setFilterMobilizedBy(null)}
                    className="whitespace-nowrap"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear '{filterMobilizedBy}' Filter
                  </Button>
                )}
                {filterWard && (
                  <Button
                    variant="outline"
                    onClick={() => setFilterWard(null)}
                    className="whitespace-nowrap"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear '{filterWard}' Filter
                  </Button>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="relative"
                  >
                    <input
                      type="file"
                      accept=".csv,text/csv,application/csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadFileName(file.name);
                        setUploading(true);
                        try {
                          const result = await api.bulkUploadVoters(file);
                          if (result.created > 0) {
                            await fetchVoters();
                          }
                          toast.success(`Imported ${result.created} voters`);
                          if (result.errors && result.errors.length) {
                            toast.message('Some rows failed', {
                              description: result.errors.slice(0, 3).join('\n'),
                            });
                          }
                        } catch (err: any) {
                          toast.error(err.message || 'Bulk upload failed');
                        } finally {
                          setUploading(false);
                          // Reset input so same file can be selected again if needed
                          e.target.value = '';
                        }
                      }}
                    />
                    {uploading ? 'Uploading…' : 'Bulk Upload CSV (CSV only)'}
                  </Button>
                  {uploadFileName && !uploading && (
                    <span className="text-xs text-muted-foreground self-center truncate max-w-[120px]">
                      {uploadFileName}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setIsBulkMode(true);
                    setMessageModalOpen(true);
                  }}
                  className="gap-2"
                  variant="outline"
                  disabled={filteredVoters.length === 0}
                >
                  <Send className="h-4 w-4" />
                  Bulk Message
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                  <p className="text-muted-foreground">Loading voters...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <X className="h-12 w-12 text-destructive/50" />
                  <p className="mt-4 text-destructive font-medium">Failed to load voters</p>
                  <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                    {error}. Check your internet connection or backend status.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => fetchVoters()}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredVoters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No voters found</p>
                  <p className="text-sm text-muted-foreground/70">
                    {voters.length === 0
                      ? 'Add your first voter using the form'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>NAME</TableHead>
                        <TableHead className={cn("hidden md:table-cell", isSidebarCollapsed && "sm:table-cell")}>ID</TableHead>
                        <TableHead className={cn("hidden lg:table-cell", isSidebarCollapsed && "md:table-cell")}>PHONE</TableHead>
                        <TableHead className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>DOB</TableHead>
                        <TableHead>R.G</TableHead>
                        <TableHead>SUPPORT %</TableHead>
                        <TableHead className="hidden sm:table-cell">FOOTBALL CLUB</TableHead>
                        <TableHead className={cn("hidden lg:table-cell", isSidebarCollapsed && "md:table-cell")}>TRIBE</TableHead>
                        <TableHead className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>WARD</TableHead>
                        <TableHead className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>POLLING CENTER</TableHead>
                        <TableHead className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>STREAM</TableHead>
                        <TableHead className={cn("hidden md:table-cell", isSidebarCollapsed && "sm:table-cell")}>MOBILIZED BY</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVoters.map((voter, index) => (
                        <TableRow key={voter.id}>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{voter.name}</TableCell>
                          <TableCell className={cn("hidden md:table-cell", isSidebarCollapsed && "sm:table-cell")}>{voter.idNumber}</TableCell>
                          <TableCell className={cn("hidden lg:table-cell", isSidebarCollapsed && "md:table-cell")}>{displayOrBlank(voter.phoneNumber)}</TableCell>
                          <TableCell className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>{displayOrBlank(voter.dob)}</TableCell>
                          <TableCell>
                            {voter.rG ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              voter.supportProbability >= 70 ? 'bg-green-500/20 text-green-400' :
                                voter.supportProbability >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                            }>
                              {voter.supportProbability}%
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{displayOrBlank(voter.footballClub)}</TableCell>
                          <TableCell className={cn("hidden lg:table-cell", isSidebarCollapsed && "md:table-cell")}>{displayOrBlank(voter.tribe)}</TableCell>
                          <TableCell className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>{displayOrBlank(voter.ward)}</TableCell>
                          <TableCell className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>{displayOrBlank(voter.pollingCenter)}</TableCell>
                          <TableCell className={cn("hidden xl:table-cell", isSidebarCollapsed && "lg:table-cell")}>{displayOrBlank(voter.stream)}</TableCell>
                          <TableCell className={cn("hidden md:table-cell", isSidebarCollapsed && "sm:table-cell")}>{displayOrBlank(voter.mobilizedBy)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedVoter(voter);
                                  setIsBulkMode(false);
                                  setMessageModalOpen(true);
                                }}
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                title="Send Message"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedVoter(voter);
                                  setChatWindowOpen(true);
                                }}
                                className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                                title="Chat History"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setFormData({
                                    name: voter.name,
                                    idNumber: voter.idNumber,
                                    phoneNumber: voter.phoneNumber || '',
                                    dob: voter.dob || '',
                                    rG: voter.rG || false,
                                    footballClub: voter.footballClub || '',
                                    tribe: voter.tribe || '',
                                    ward: voter.ward || '',
                                    pollingCenter: voter.pollingCenter || '',
                                    stream: voter.stream || '',
                                    mobilizedBy: voter.mobilizedBy || '',
                                    clan: voter.clan || '',
                                    pollingStationName: voter.pollingStationName || '',
                                    location: voter.location || '',
                                    status: voter.status,
                                    notes: voter.notes || '',
                                  });
                                  setIsEditing(true);
                                  setEditingVoterId(voter.id);
                                  setShowAddForm(true);
                                  // Scroll to top or form if in mobile
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                                title="Edit Voter"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  deleteVoter(voter.id);
                                  toast.success('Voter removed');
                                }}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        voter={!isBulkMode ? selectedVoter || undefined : undefined}
        voterIds={isBulkMode ? filteredVoters.map(v => v.id) : undefined}
      />

      <ConversationWindow
        isOpen={chatWindowOpen}
        onClose={() => setChatWindowOpen(false)}
        voter={selectedVoter}
      />
    </MainLayout >
  );
}
