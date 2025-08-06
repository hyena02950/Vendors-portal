
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { AnalyticsData } from "@/hooks/useAnalytics";

interface PerformanceMetricsProps {
  data: AnalyticsData;
}

export const PerformanceMetrics = ({ data }: PerformanceMetricsProps) => {
  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Onboarding Time</p>
                <p className="text-2xl font-bold">{data.vendorMetrics.avgOnboardingTime.toFixed(1)} days</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-xs text-muted-foreground">Target: 5 days</span>
                </div>
              </div>
              <Progress 
                value={Math.min((5 / data.vendorMetrics.avgOnboardingTime) * 100, 100)} 
                className="w-16" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Document Approval Rate</p>
                <p className="text-2xl font-bold">{data.documentMetrics.approvalRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-xs text-muted-foreground">
                    {data.documentMetrics.approvedDocuments}/{data.documentMetrics.totalDocuments}
                  </span>
                </div>
              </div>
              <Progress value={data.documentMetrics.approvalRate} className="w-16" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold">{data.documentMetrics.avgProcessingTime.toFixed(1)} days</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-orange-600 mr-1" />
                  <span className="text-xs text-muted-foreground">Target: 2 days</span>
                </div>
              </div>
              <Progress 
                value={Math.min((2 / data.documentMetrics.avgProcessingTime) * 100, 100)} 
                className="w-16" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Placement Rate</p>
                <p className="text-2xl font-bold">{data.candidateMetrics.placementRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-xs text-muted-foreground">
                    {data.candidateMetrics.hiredCandidates}/{data.candidateMetrics.totalCandidates}
                  </span>
                </div>
              </div>
              <Progress value={data.candidateMetrics.placementRate} className="w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Processing Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.performanceData.documentProcessingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="approved" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Approved"
              />
              <Area 
                type="monotone" 
                dataKey="rejected" 
                stackId="1"
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.6}
                name="Rejected"
              />
              <Area 
                type="monotone" 
                dataKey="pending" 
                stackId="1"
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.6}
                name="Pending"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vendor Performance Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.performanceData.vendorPerformance.slice(0, 10).map((vendor, index) => (
              <div key={vendor.vendorName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{vendor.vendorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.submissions} submissions • {vendor.hires} hires
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{vendor.rate.toFixed(1)}%</p>
                  <Progress value={vendor.rate} className="w-20 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
