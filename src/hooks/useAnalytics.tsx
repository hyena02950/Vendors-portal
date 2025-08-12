
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/utils/auth";

export interface AnalyticsData {
  vendorMetrics: {
    totalVendors: number;
    activeVendors: number;
    pendingVendors: number;
    approvalRate: number;
    avgOnboardingTime: number;
  };
  documentMetrics: {
    totalDocuments: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    pendingDocuments: number;
    approvalRate: number;
    avgProcessingTime: number;
  };
  candidateMetrics: {
    totalCandidates: number;
    submittedThisMonth: number;
    interviewsScheduled: number;
    hiredCandidates: number;
    placementRate: number;
  };
  performanceData: {
    monthlySubmissions: Array<{ month: string; submissions: number; interviews: number; hired: number }>;
    vendorPerformance: Array<{ vendorName: string; submissions: number; hires: number; rate: number }>;
    documentProcessingTrends: Array<{ date: string; approved: number; rejected: number; pending: number }>;
  };
  timeRangeData: {
    startDate: Date;
    endDate: Date;
  };
}

export const useAnalytics = (timeRange: string = 'last30days') => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getTimeRangeDates = (range: string) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case 'last7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'last6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'lastyear':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getTimeRangeDates(timeRange);
      
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsResponse = await response.json();
      console.log('Analytics API response:', analyticsResponse);

      // Use the structured response from the API
      const analyticsData: AnalyticsData = {
        vendorMetrics: analyticsResponse.vendorMetrics || {
          totalVendors: 0,
          activeVendors: 0,
          pendingVendors: 0,
          approvalRate: 0,
          avgOnboardingTime: 0,
        },
        documentMetrics: analyticsResponse.documentMetrics || {
          totalDocuments: 0,
          approvedDocuments: 0,
          rejectedDocuments: 0,
          pendingDocuments: 0,
          approvalRate: 0,
          avgProcessingTime: 0,
        },
        candidateMetrics: analyticsResponse.candidateMetrics || {
          totalCandidates: 0,
          submittedThisMonth: 0,
          interviewsScheduled: 0,
          hiredCandidates: 0,
          placementRate: 0,
        },
        performanceData: analyticsResponse.performanceData || {
          monthlySubmissions: [],
          vendorPerformance: [],
          documentProcessingTrends: [],
        },
        timeRangeData: {
          startDate,
          endDate,
        },
      };

      setData(analyticsData);
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (candidates: any[]) => {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthCandidates = candidates.filter(c => {
        const submitted = new Date(c.submitted_at);
        return submitted >= monthStart && submitted <= monthEnd;
      });

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        submissions: monthCandidates.length,
        interviews: monthCandidates.filter(c => c.status === 'interviewed' || c.status === 'hired').length,
        hired: monthCandidates.filter(c => c.status === 'hired').length,
      });
    }
    
    return monthlyData;
  };

  const generateVendorPerformanceData = (candidates: any[], documents: any[]) => {
    const vendorMap = new Map();
    
    candidates.forEach(candidate => {
      if (!vendorMap.has(candidate.vendor_id)) {
        vendorMap.set(candidate.vendor_id, {
          submissions: 0,
          hires: 0,
        });
      }
      
      const vendor = vendorMap.get(candidate.vendor_id);
      vendor.submissions += 1;
      if (candidate.status === 'hired') {
        vendor.hires += 1;
      }
    });

    return Array.from(vendorMap.entries()).map(([vendorId, data]) => {
      const vendorDoc = documents.find(d => d.vendor_id === vendorId);
      return {
        vendorName: vendorDoc?.vendors?.name || `Vendor ${vendorId.slice(0, 8)}`,
        submissions: data.submissions,
        hires: data.hires,
        rate: data.submissions > 0 ? (data.hires / data.submissions) * 100 : 0,
      };
    }).slice(0, 10); // Top 10 vendors
  };

  const generateDocumentTrends = (documents: any[]) => {
    const trends = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayDocs = documents.filter(d => {
        const reviewed = d.reviewed_at ? new Date(d.reviewed_at) : null;
        return reviewed && reviewed >= dayStart && reviewed < dayEnd;
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        approved: dayDocs.filter(d => d.status === 'approved').length,
        rejected: dayDocs.filter(d => d.status === 'rejected').length,
        pending: dayDocs.filter(d => d.status === 'pending').length,
      });
    }
    
    return trends;
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const refetch = () => {
    fetchAnalyticsData();
  };

  return { data, loading, error, refetch };
};
