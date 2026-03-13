import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { useCampaignStore } from "@/store/campaignStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Settings as SettingsIcon, Trash2, Sun, Moon, ShieldAlert, Lock } from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { voters, deleteAllVoters } = useCampaignStore();
  const { user } = useAuthStore();
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDeleteAll = async () => {
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setIsVerifying(true);
    try {
      // Verify password by attempting to login (background check)
      if (!user) throw new Error("Not authenticated");
      
      await api.login({ username: user.username, password });
      
      // If login succeeds, proceed with deletion
      await deleteAllVoters();
      toast.success('All voters deleted successfully');
      setIsConfirmOpen(false);
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || 'Incorrect password. Permission denied.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the application looks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="theme-toggle">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle between bright and dark application themes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    id="theme-toggle"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Actions that affect your voter database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col space-y-1">
                  <Label className="text-destructive">Danger Zone</Label>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove all voter records from the system.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={voters.length === 0}
                  className="w-fit"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Registered Voters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Security Confirmation
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete **{voters.length}** records. To confirm, please enter your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Your Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password && !isVerifying) {
                      handleDeleteAll();
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsConfirmOpen(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={!password || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Confirm Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Settings;
