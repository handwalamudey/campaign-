import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCampaignStore } from "@/store/campaignStore";
import { useAuthStore } from "@/store/authStore";
import Dashboard from "./pages/Dashboard";
import Voters from "./pages/Voters";
import DataManagement from "./pages/DataManagement";
import FieldReports from "./pages/FieldReports";
import Analytics from "./pages/Analytics";
import Mobilizers from "./pages/Mobilizers";
import Clans from "./pages/Clans";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const fetchVoters = useCampaignStore((state) => state.fetchVoters);
  const fetchStations = useCampaignStore((state) => state.fetchStations);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVoters();
      fetchStations();
    }
  }, [fetchVoters, fetchStations, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/voters" element={
              <ProtectedRoute>
                <Voters />
              </ProtectedRoute>
            } />
            <Route path="/mobilizers" element={
              <ProtectedRoute>
                <Mobilizers />
              </ProtectedRoute>
            } />
            <Route path="/clans" element={
              <ProtectedRoute>
                <Clans />
              </ProtectedRoute>
            } />
            <Route path="/data" element={
              <ProtectedRoute allowedRoles={['admin', 'aspirant']}>
                <DataManagement />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <FieldReports />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'aspirant']}>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />


            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
