
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { ApplicationStatus } from "@/hooks/useVendorApplication";
import { getToken } from "@/utils/auth";

export interface VendorApplicationWithDetails {
  id: string;
  vendor_id: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  vendor_name: string;
  vendor_email: string;
  vendor_status: string;
  total_documents: number;
  approved_documents: number;
  mandatory_documents_approved: boolean;
}

export const useAllVendorApplications = () => {
  const { isElikaAdmin } = useUserRole();
  const { toast } = useToast();
  const [applications, setApplications] = useState<VendorApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isElikaAdmin) {
      fetchApplications();
      
      // Set up polling for updates
      const interval = setInterval(fetchApplications, 30000); // Poll every 30 seconds

      return () => {
        clearInterval(interval);
      };
    }
  }, [isElikaAdmin]);

  const fetchApplications = async () => {
    if (!isElikaAdmin) {
      setApplications([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching all vendor applications...');

      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor applications');
      }

      const data = await response.json();
      const combinedData: VendorApplicationWithDetails[] = data.applications || [];

      console.log('Combined application data:', combinedData);
      setApplications(combinedData);
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    applications,
    loading,
    refetch: fetchApplications
  };
};
