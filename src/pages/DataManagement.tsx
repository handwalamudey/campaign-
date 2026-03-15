import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCampaignStore } from '@/store/campaignStore';
import { CLANS, DemographicEntry, ZoneType } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  Database,
  Users,
  MapPin
} from 'lucide-react';

const DataManagement = () => {
  const { demographics, addDemographic, addDemographics, deleteDemographic, stations, addStation, deleteStation } = useCampaignStore();

  const [formData, setFormData] = useState({
    pollingStationId: '',
    clan: '',
    estimatedVoters: '',
    supportLevel: '',
    turnoutLikelihood: '',
  });

  const [stationFormData, setStationFormData] = useState({
    name: '',
    registeredVoters: '',
    zoneType: 'swing' as ZoneType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pollingStationId || !formData.clan) {
      toast.error('Please fill in all required fields');
      return;
    }

    const station = stations.find(ps => ps.id === formData.pollingStationId);

    addDemographic({
      pollingStationId: formData.pollingStationId,
      pollingStationName: station?.name || '',
      clan: formData.clan,
      estimatedVoters: parseInt(formData.estimatedVoters) || 0,
      supportLevel: parseFloat(formData.supportLevel) || 50,
      turnoutLikelihood: parseFloat(formData.turnoutLikelihood) || 65,
    });

    toast.success('Demographic entry added successfully');

    setFormData({
      pollingStationId: '',
      clan: '',
      estimatedVoters: '',
      supportLevel: '',
      turnoutLikelihood: '',
    });
  };

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationFormData.name || !stationFormData.registeredVoters) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addStation({
        name: stationFormData.name,
        registeredVoters: parseInt(stationFormData.registeredVoters),
        zoneType: stationFormData.zoneType,
      });
      toast.success('Polling station added successfully');
      setStationFormData({
        name: '',
        registeredVoters: '',
        zoneType: 'swing',
      });
    } catch (error) {
      toast.error('Failed to add polling station');
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const entries: Omit<DemographicEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });

          const station = stations.find(
            ps => ps.name.toLowerCase() === row['polling_station']?.toLowerCase() ||
              ps.id === row['polling_station_id']
          );

          if (station && row['age_group'] && row['clan']) {
            entries.push({
              pollingStationId: station.id,
              pollingStationName: station.name,
              clan: row['clan'],
              estimatedVoters: parseInt(row['estimated_voters']) || 0,
              supportLevel: parseFloat(row['support_level']) || 50,
              turnoutLikelihood: parseFloat(row['turnout_likelihood']) || 65,
            });
          }
        }

        if (entries.length > 0) {
          addDemographics(entries);
          toast.success(`Successfully imported ${entries.length} entries`);
        } else {
          toast.error('No valid entries found in file');
        }
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['polling_station', 'clan', 'estimated_voters', 'support_level', 'turnout_likelihood'];
    const sampleData = [
      ['Garissa Primary School', 'Ogaden', '500', '65', '70'],
      ['Township Secondary', 'Abdalla', '350', '55', '60'],
    ];

    const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demographics_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Data Management</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage demographic data for polling stations
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
              <Database className="h-3.5 w-3.5" />
              {demographics.length} entries
            </span>
          </div>
        </div>

        <Tabs defaultValue="stations" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full justify-start gap-2 bg-muted/50 p-1">
              <TabsTrigger value="stations" className="whitespace-nowrap px-4 py-2 text-sm font-medium transition-all">
                <MapPin className="mr-2 h-4 w-4" />
                Stations
              </TabsTrigger>
              <TabsTrigger value="entry" className="whitespace-nowrap px-4 py-2 text-sm font-medium transition-all">
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="bulk" className="whitespace-nowrap px-4 py-2 text-sm font-medium transition-all">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="view" className="whitespace-nowrap px-4 py-2 text-sm font-medium transition-all">
                <Users className="mr-2 h-4 w-4" />
                View Data
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Polling Stations */}
          <TabsContent value="stations" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Add Station Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleStationSubmit} className="stat-card sticky top-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Add Polling Station
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stationName">Station Name *</Label>
                      <Input
                        id="stationName"
                        placeholder="e.g., Garissa Primary"
                        value={stationFormData.name}
                        onChange={(e) => setStationFormData({ ...stationFormData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registeredVoters">Registered Voters *</Label>
                      <Input
                        id="registeredVoters"
                        type="number"
                        placeholder="e.g., 2500"
                        value={stationFormData.registeredVoters}
                        onChange={(e) => setStationFormData({ ...stationFormData, registeredVoters: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zoneType">Zone Type *</Label>
                      <Select
                        value={stationFormData.zoneType}
                        onValueChange={(value) => setStationFormData({ ...stationFormData, zoneType: value as ZoneType })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stronghold">Stronghold</SelectItem>
                          <SelectItem value="swing">Swing</SelectItem>
                          <SelectItem value="weak">Weak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Add Station
                    </Button>
                  </div>
                </form>
              </div>

              {/* Stations List */}
              <div className="lg:col-span-2">
                <div className="stat-card overflow-hidden p-0">
                  <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <h3 className="font-semibold text-foreground">Existing Stations</h3>
                  </div>

                  {stations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MapPin className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-4">No polling stations yet.</p>
                      <p className="text-sm">Add your first station using the form.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Voters</TableHead>
                            <TableHead>Zone</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stations.map((station) => (
                            <TableRow key={station.id}>
                              <TableCell className="font-medium">
                                {station.name}
                              </TableCell>
                              <TableCell className="text-right">
                                {station.registeredVoters.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${station.zoneType === 'stronghold'
                                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                                  : station.zoneType === 'swing'
                                    ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                                  }`}>
                                  {station.zoneType}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm('Delete this station? This may affect associated data.')) {
                                      deleteStation(station.id);
                                      toast.success('Station deleted');
                                    }
                                  }}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Manual Entry */}
          <TabsContent value="entry" className="space-y-6">
            <form onSubmit={handleSubmit} className="stat-card">
              <h3 className="mb-6 text-lg font-semibold text-foreground">
                Add Demographic Entry
              </h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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


                <div className="space-y-2">
                  <Label htmlFor="clan">Clan *</Label>
                  <Select
                    value={formData.clan}
                    onValueChange={(value) => setFormData({ ...formData, clan: value })}
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
                  <Label htmlFor="estimatedVoters">Estimated Voters</Label>
                  <Input
                    id="estimatedVoters"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.estimatedVoters}
                    onChange={(e) => setFormData({ ...formData, estimatedVoters: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportLevel">Support Level (%)</Label>
                  <Input
                    id="supportLevel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 65"
                    value={formData.supportLevel}
                    onChange={(e) => setFormData({ ...formData, supportLevel: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnoutLikelihood">Turnout Likelihood (%)</Label>
                  <Input
                    id="turnoutLikelihood"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                    value={formData.turnoutLikelihood}
                    onChange={(e) => setFormData({ ...formData, turnoutLikelihood: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="submit" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Bulk Upload */}
          <TabsContent value="bulk" className="space-y-6">
            <div className="stat-card">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    Bulk Upload Demographics
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a CSV file with demographic data. Download the template for the correct format.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <label>
                  <Button asChild className="gap-2 cursor-pointer">
                    <span>
                      <Upload className="h-4 w-4" />
                      Upload CSV
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="text-sm font-medium text-foreground">
                  Required CSV Columns:
                </h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li><code className="text-primary">polling_station</code> - Name of the polling station</li>
                  <li><code className="text-primary">clan</code> - Clan name</li>
                  <li><code className="text-primary">estimated_voters</code> - Number of voters</li>
                  <li><code className="text-primary">support_level</code> - Percentage (0-100)</li>
                  <li><code className="text-primary">turnout_likelihood</code> - Percentage (0-100)</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* View Data */}
          <TabsContent value="view" className="space-y-6">
            <div className="stat-card overflow-hidden p-0">
              {demographics.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Database className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">No demographic data yet.</p>
                  <p className="text-sm">Add entries manually or upload a CSV file.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Polling Station</TableHead>
                        <TableHead>Clan</TableHead>
                        <TableHead className="text-right">Voters</TableHead>
                        <TableHead className="text-right">Support</TableHead>
                        <TableHead className="text-right">Turnout</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demographics.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.pollingStationName}
                          </TableCell>
                          <TableCell>{entry.clan}</TableCell>
                          <TableCell className="text-right">
                            {entry.estimatedVoters.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.supportLevel}%
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.turnoutLikelihood}%
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                deleteDemographic(entry.id);
                                toast.success('Entry deleted');
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DataManagement;
