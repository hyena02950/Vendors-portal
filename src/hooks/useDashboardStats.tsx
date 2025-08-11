
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { getToken } from "@/utils/auth";

interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  candidatesSubmitted: number;
  scheduledInterviews: number;
  interviewsScheduled: number;
  pendingInvoices: number;
  totalInvoices: number;
  pendingApprovals: number;
  pendingInvoicesAmount: number;
  totalSubmissions: number;
  shortlistedCandidates: number;
  pendingInterviews: number;
  completedJoins: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  jobsTrend: number;
  candidatesTrend: number;
  interviewsTrend: number;
  invoicesTrend: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalCandidates: 0,
    candidatesSubmitted: 0,
    scheduledInterviews: 0,
    interviewsScheduled: 0,
    pendingInvoices: 0,
    totalInvoices: 0,
    pendingApprovals: 0,
    pendingInvoicesAmount: 0,
    totalSubmissions: 0,
    shortlistedCandidates: 0,
    pendingInterviews: 0,
    completedJoins: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    jobsTrend: 5,
    candidatesTrend: 12,
    interviewsTrend: 8,
    invoicesTrend: -2,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { vendorId, isVendorUser, isElikaUser, loading: roleLoading } = useUserRole();

  const fetchStats = async () => {
    if (roleLoading) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      let endpoint = '/api/dashboard/vendor-stats';
      
      // Use different endpoint for Elika users
      if (isElikaUser) {
        endpoint = '/api/dashboard/admin-stats';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(prevStats => ({
        ...prevStats,
        ...data
      }));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard statistics';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      fetchStats();
    }
  }, [vendorId, isVendorUser, isElikaUser, roleLoading]);

  const refetch = async () => {
    await fetchStats();
  };

  return { stats, loading, error, refetch };
};
