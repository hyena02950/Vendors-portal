
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, Users, FileText, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PerformanceMetrics } from "@/components/analytics/PerformanceMetrics";
import { ExportControls } from "@/components/analytics/ExportControls";
import { Skeleton } from "@/components/ui/skeleton";

export const AnalyticsTab = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("last30days");
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: analyticsData, loading, error, refetch } = useAnalytics(timeRange);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    toast({
      title: "Time Range Updated",
      description: `Analytics updated for ${value.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading analytics data</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const statusData = [
    { name: 'Pending', value: analyticsData.documentMetrics.pendingDocuments, color: '#f59e0b' },
    { name: 'Approved', value: analyticsData.documentMetrics.approvedDocuments, color: '#10b981' },
    { name: 'Rejected', value: analyticsData.documentMetrics.rejectedDocuments, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="lastyear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
                    <p className="text-2xl font-bold text-primary">{analyticsData.vendorMetrics.totalVendors}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.vendorMetrics.activeVendors} active
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Document Approval Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData.documentMetrics.approvalRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.documentMetrics.approvedDocuments} approved
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Placement Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData.candidateMetrics.placementRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.candidateMetrics.hiredCandidates} hired
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600 opacity-60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Onboarding Time</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analyticsData.vendorMetrics.avgOnboardingTime.toFixed(1)}d
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Target: 5 days</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Monthly Submission Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.performanceData.monthlySubmissions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submissions" fill="#3b82f6" name="Submissions" />
                    <Bar dataKey="interviews" fill="#10b981" name="Interviews" />
                    <Bar dataKey="hired" fill="#06d6a0" name="Hired" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Document Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics data={analyticsData} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Vendor Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Vendor Name</th>
                      <th className="text-right p-2">Submissions</th>
                      <th className="text-right p-2">Hires</th>
                      <th className="text-right p-2">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.performanceData.vendorPerformance.map((vendor, index) => (
                      <tr key={vendor.vendorName} className="border-b">
                        <td className="p-2 font-bold">#{index + 1}</td>
                        <td className="p-2">{vendor.vendorName}</td>
                        <td className="p-2 text-right">{vendor.submissions}</td>
                        <td className="p-2 text-right">{vendor.hires}</td>
                        <td className="p-2 text-right font-bold">
                          {vendor.rate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <ExportControls data={analyticsData} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
