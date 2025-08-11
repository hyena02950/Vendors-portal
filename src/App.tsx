
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import VendorOnboardingPage from "@/pages/VendorOnboardingPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import CandidateSubmission from "@/pages/CandidateSubmission";
import InvoiceUpload from "@/pages/InvoiceUpload";
import CreateJob from "@/pages/CreateJob";
import ScheduleInterview from "@/pages/ScheduleInterview";
import NotFound from "@/pages/NotFound";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/vendor-onboarding" element={
                  <ProtectedRoute>
                    <VendorOnboardingPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/vendor-dashboard" element={
                  <ProtectedRoute>
                    <VendorDashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/submit-candidate" element={
                  <ProtectedRoute>
                    <CandidateSubmission />
                  </ProtectedRoute>
                } />
                
                <Route path="/invoice-upload" element={
                  <ProtectedRoute>
                    <InvoiceUpload />
                  </ProtectedRoute>
                } />
                
                <Route path="/create-job" element={
                  <ProtectedRoute>
                    <CreateJob />
                  </ProtectedRoute>
                } />
                
                <Route path="/schedule-interview" element={
                  <ProtectedRoute>
                    <ScheduleInterview />
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
