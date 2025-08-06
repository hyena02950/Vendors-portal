
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

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
    jobsTrend: 0,
    candidatesTrend: 0,
    interviewsTrend: 0,
    invoicesTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { vendorId, isVendorUser, isElikaUser, loading: roleLoading } = useUserRole();

  const fetchStats = async () => {
    if (roleLoading) {
      console.log('Role still loading, skipping stats fetch');
      return;
    }

    console.log('Fetching dashboard stats...');
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user for stats:', user?.id);
      
      if (!user) {
        console.log('No user found, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('User role info for stats - VendorId:', vendorId, 'IsVendorUser:', isVendorUser, 'IsElikaUser:', isElikaUser);

      let newStats: DashboardStats = {
        activeJobs: 0,
        totalCandidates: 0,
        candidatesSubmitted: 0,
        scheduledInterviews: 0,
        interviewsScheduled: 0,
        pendingInvoices: 0,
        totalInvoices: 0,
        pendingApprovals: 0,
        pendingInvoicesAmount: 0,
        jobsTrend: 5, // Mock trend data
        candidatesTrend: 12,
        interviewsTrend: 8,
        invoicesTrend: -2,
      };

      if (isVendorUser && vendorId) {
        console.log('Fetching stats for vendor user with vendor ID:', vendorId);

        // For vendor users, convert vendorId to string for the contains check
        const { count: jobsCount, error: jobsError } = await supabase
          .from('job_descriptions')
          .select('*', { count: 'exact', head: true })
          .contains('assigned_vendors', [vendorId])
          .eq('status', 'active');

        if (jobsError) {
          console.error('Jobs query error:', jobsError);
        } else {
          console.log('Active jobs count for vendor:', jobsCount);
          newStats.activeJobs = jobsCount || 0;
        }

        // Fetch candidates submitted count using vendor_id
        const { count: candidatesCount, error: candidatesError } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId);

        if (candidatesError) {
          console.error('Candidates query error:', candidatesError);
        } else {
          console.log('Candidates count for vendor:', candidatesCount);
          newStats.candidatesSubmitted = candidatesCount || 0;
          newStats.totalCandidates = candidatesCount || 0;
        }

        // Fetch scheduled interviews count using vendor_id
        const { count: interviewsCount, error: interviewsError } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .eq('status', 'scheduled');

        if (interviewsError) {
          console.error('Interviews query error:', interviewsError);
        } else {
          console.log('Interviews count for vendor:', interviewsCount);
          newStats.interviewsScheduled = interviewsCount || 0;
          newStats.scheduledInterviews = interviewsCount || 0;
        }

        // Fetch pending invoices using vendor_id
        const { data: pendingInvoicesData, count: pendingInvoicesCount, error: invoicesError } = await supabase
          .from('invoices')
          .select('amount', { count: 'exact' })
          .eq('vendor_id', vendorId)
          .eq('status', 'pending');

        if (invoicesError) {
          console.error('Invoices query error:', invoicesError);
        } else {
          console.log('Pending invoices data for vendor:', pendingInvoicesData, 'Count:', pendingInvoicesCount);
          const totalPendingAmount = pendingInvoicesData?.reduce((sum, invoice) => 
            sum + Number(invoice.amount), 0) || 0;

          newStats.pendingInvoices = pendingInvoicesCount || 0;
          newStats.totalInvoices = pendingInvoicesCount || 0;
          newStats.pendingInvoicesAmount = totalPendingAmount;
        }
      } else if (isElikaUser) {
        console.log('Fetching stats for Elika user:', user.id);

        // For Elika users (admin, delivery head, finance), show all stats
        const { count: jobsCount, error: jobsError } = await supabase
          .from('job_descriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (jobsError) {
          console.error('Jobs query error:', jobsError);
        } else {
          console.log('All active jobs count:', jobsCount);
          newStats.activeJobs = jobsCount || 0;
        }

        // Fetch all candidates
        const { count: candidatesCount, error: candidatesError } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true });

        if (candidatesError) {
          console.error('Candidates query error:', candidatesError);
        } else {
          console.log('All candidates count:', candidatesCount);
          newStats.candidatesSubmitted = candidatesCount || 0;
          newStats.totalCandidates = candidatesCount || 0;
        }

        // Fetch all scheduled interviews
        const { count: interviewsCount, error: interviewsError } = await supabase
          .from('interviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled');

        if (interviewsError) {
          console.error('Interviews query error:', interviewsError);
        } else {
          console.log('All interviews count:', interviewsCount);
          newStats.interviewsScheduled = interviewsCount || 0;
          newStats.scheduledInterviews = interviewsCount || 0;
        }

        // Fetch all pending invoices
        const { data: pendingInvoicesData, count: pendingInvoicesCount, error: invoicesError } = await supabase
          .from('invoices')
          .select('amount', { count: 'exact' })
          .eq('status', 'pending');

        if (invoicesError) {
          console.error('Invoices query error:', invoicesError);
        } else {
          console.log('All pending invoices data:', pendingInvoicesData, 'Count:', pendingInvoicesCount);
          const totalPendingAmount = pendingInvoicesData?.reduce((sum, invoice) => 
            sum + Number(invoice.amount), 0) || 0;

          newStats.pendingInvoices = pendingInvoicesCount || 0;
          newStats.totalInvoices = pendingInvoicesCount || 0;
          newStats.pendingApprovals = pendingInvoicesCount || 0;
          newStats.pendingInvoicesAmount = totalPendingAmount;
        }
      } else {
        console.log('User has no recognized role, showing zero stats');
      }

      console.log('Setting new stats:', newStats);
      setStats(newStats);
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
    // Only fetch stats when role loading is complete
    if (!roleLoading) {
      fetchStats();
      
      // Set up real-time subscription for stats updates
      const channel = supabase.channel('dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_descriptions' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [vendorId, isVendorUser, isElikaUser, roleLoading]);

  const refetch = async () => {
    await fetchStats();
  };

  return { stats, loading, error, refetch };
};
