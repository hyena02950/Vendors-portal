
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import VendorOnboardingPage from "./pages/VendorOnboardingPage";
import CreateJob from "./pages/CreateJob";
import CandidateSubmission from "./pages/CandidateSubmission";
import ScheduleInterview from "./pages/ScheduleInterview";
import InvoiceUpload from "./pages/InvoiceUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor-dashboard"
              element={
                <ProtectedRoute>
                  <VendorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor-onboarding"
              element={
                <ProtectedRoute>
                  <VendorOnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-job"
              element={
                <ProtectedRoute>
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-candidate"
              element={
                <ProtectedRoute>
                  <CandidateSubmission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule-interview"
              element={
                <ProtectedRoute>
                  <ScheduleInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice-upload"
              element={
                <ProtectedRoute>
                  <InvoiceUpload />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
