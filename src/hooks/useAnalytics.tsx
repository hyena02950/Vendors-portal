
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      
      // Fetch vendor metrics
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (vendorsError) throw vendorsError;

      // Fetch document metrics
      const { data: documents, error: documentsError } = await supabase
        .from('vendor_documents')
        .select('*, vendors(name)')
        .gte('uploaded_at', startDate.toISOString())
        .lte('uploaded_at', endDate.toISOString());

      if (documentsError) throw documentsError;

      // Fetch candidate metrics
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .gte('submitted_at', startDate.toISOString())
        .lte('submitted_at', endDate.toISOString());

      if (candidatesError) throw candidatesError;

      // Fetch vendor applications for onboarding time calculation
      const { data: applications, error: applicationsError } = await supabase
        .from('vendor_applications')
        .select('*, vendors(name, created_at)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (applicationsError) throw applicationsError;

      // Calculate vendor metrics
      const totalVendors = vendors?.length || 0;
      const activeVendors = vendors?.filter(v => v.status === 'active').length || 0;
      const pendingVendors = vendors?.filter(v => v.status === 'pending').length || 0;
      const approvedApplications = applications?.filter(a => a.status === 'approved').length || 0;
      const vendorApprovalRate = applications?.length ? (approvedApplications / applications.length) * 100 : 0;

      // Calculate average onboarding time
      const completedOnboarding = applications?.filter(a => a.status === 'approved' && a.reviewed_at) || [];
      const avgOnboardingTime = completedOnboarding.length > 0 
        ? completedOnboarding.reduce((acc, app) => {
            const created = new Date(app.vendors?.created_at || app.created_at);
            const approved = new Date(app.reviewed_at!);
            return acc + (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedOnboarding.length 
        : 0;

      // Calculate document metrics
      const totalDocuments = documents?.length || 0;
      const approvedDocuments = documents?.filter(d => d.status === 'approved').length || 0;
      const rejectedDocuments = documents?.filter(d => d.status === 'rejected').length || 0;
      const pendingDocuments = documents?.filter(d => d.status === 'pending').length || 0;
      const documentApprovalRate = totalDocuments > 0 ? (approvedDocuments / totalDocuments) * 100 : 0;

      // Calculate average document processing time
      const processedDocs = documents?.filter(d => d.reviewed_at) || [];
      const avgProcessingTime = processedDocs.length > 0
        ? processedDocs.reduce((acc, doc) => {
            const uploaded = new Date(doc.uploaded_at!);
            const reviewed = new Date(doc.reviewed_at!);
            return acc + (reviewed.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / processedDocs.length
        : 0;

      // Calculate candidate metrics
      const totalCandidates = candidates?.length || 0;
      const submittedThisMonth = candidates?.filter(c => {
        const submitted = new Date(c.submitted_at);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return submitted >= thisMonth;
      }).length || 0;

      // Fetch interviews for candidate metrics
      const { data: interviews } = await supabase
        .from('interviews')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const interviewsScheduled = interviews?.length || 0;
      const hiredCandidates = candidates?.filter(c => c.status === 'hired').length || 0;
      const placementRate = totalCandidates > 0 ? (hiredCandidates / totalCandidates) * 100 : 0;

      // Generate performance data
      const monthlySubmissions = generateMonthlyData(candidates || []);
      const vendorPerformance = generateVendorPerformanceData(candidates || [], documents || []);
      const documentProcessingTrends = generateDocumentTrends(documents || []);

      const analyticsData: AnalyticsData = {
        vendorMetrics: {
          totalVendors,
          activeVendors,
          pendingVendors,
          approvalRate: vendorApprovalRate,
          avgOnboardingTime,
        },
        documentMetrics: {
          totalDocuments,
          approvedDocuments,
          rejectedDocuments,
          pendingDocuments,
          approvalRate: documentApprovalRate,
          avgProcessingTime,
        },
        candidateMetrics: {
          totalCandidates,
          submittedThisMonth,
          interviewsScheduled,
          hiredCandidates,
          placementRate,
        },
        performanceData: {
          monthlySubmissions,
          vendorPerformance,
          documentProcessingTrends,
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
