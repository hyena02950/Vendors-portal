
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/StatsCard";
import { JobDescriptionsTab } from "@/components/tabs/JobDescriptionsTab";
import { CandidatesTab } from "@/components/tabs/CandidatesTab";
import { InterviewsTab } from "@/components/tabs/InterviewsTab";
import { InvoicesTab } from "@/components/tabs/InvoicesTab";
import { AnalyticsTab } from "@/components/tabs/AnalyticsTab";
import { ProfileSettingsTab } from "@/components/tabs/ProfileSettingsTab";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUserRole } from "@/hooks/useUserRole";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Users, FileText, Calendar, Receipt, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { stats, loading, error, refetch } = useDashboardStats();
  const { isVendorUser, isElikaUser, loading: roleLoading } = useUserRole();

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    refetch();
  };

  // Helper function to format trend data
  const formatTrend = (value: number) => ({
    value: `${value > 0 ? '+' : ''}${value}%`,
    isPositive: value >= 0
  });

  // Different tabs for different user types
  const getTabsList = () => {
    if (isElikaUser) {
      return (
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="jobs" className="text-xs lg:text-sm">
            Job Descriptions
          </TabsTrigger>
          <TabsTrigger value="candidates" className="text-xs lg:text-sm">
            Candidates
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs lg:text-sm">
            Interviews
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs lg:text-sm">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs lg:text-sm">
            <TrendingUp className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs lg:text-sm">
            Settings
          </TabsTrigger>
        </TabsList>
      );
    } else {
      return (
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="jobs" className="text-xs lg:text-sm">
            Job Descriptions
          </TabsTrigger>
          <TabsTrigger value="candidates" className="text-xs lg:text-sm">
            Candidates
          </TabsTrigger>
          <TabsTrigger value="interviews" className="text-xs lg:text-sm">
            Interviews
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs lg:text-sm">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs lg:text-sm">
            Settings
          </TabsTrigger>
        </TabsList>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto py-8 px-4 lg:px-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isElikaUser ? 'Admin Dashboard' : 'Vendor Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isVendorUser 
                    ? "Manage your recruitment activities and track performance." 
                    : "Overview of all recruitment activities and system metrics."}
                </p>
              </div>

              {error && (
                <ErrorAlert
                  title="Failed to load dashboard statistics"
                  message={error}
                  onRetry={handleRetry}
                  onDismiss={() => {}}
                />
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Active Jobs"
                  value={stats.activeJobs}
                  icon={FileText}
                  trend={formatTrend(stats.jobsTrend)}
                />
                <StatsCard
                  title={isVendorUser ? "Total Submissions" : "Total Candidates"}
                  value={isVendorUser ? stats.totalSubmissions : stats.totalCandidates}
                  icon={Users}
                  trend={formatTrend(stats.candidatesTrend)}
                />
                <StatsCard
                  title="Scheduled Interviews"
                  value={stats.scheduledInterviews}
                  icon={Calendar}
                  trend={formatTrend(stats.interviewsTrend)}
                />
                <StatsCard
                  title={isVendorUser ? "Pending Invoices" : "Pending Approvals"}
                  value={isVendorUser ? stats.pendingInvoices : stats.pendingApprovals}
                  icon={Receipt}
                  trend={formatTrend(stats.invoicesTrend)}
                />
              </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue={isVendorUser ? "jobs" : "candidates"} className="space-y-4">
                {getTabsList()}

                <div className="mt-6">
                  <TabsContent value="jobs" className="space-y-4">
                    <JobDescriptionsTab />
                  </TabsContent>

                  <TabsContent value="candidates" className="space-y-4">
                    <CandidatesTab />
                  </TabsContent>

                  <TabsContent value="interviews" className="space-y-4">
                    <InterviewsTab />
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    <InvoicesTab />
                  </TabsContent>

                  {isElikaUser && (
                    <TabsContent value="analytics" className="space-y-4">
                      <AnalyticsTab />
                    </TabsContent>
                  )}

                  <TabsContent value="settings" className="space-y-4">
                    <ProfileSettingsTab />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
