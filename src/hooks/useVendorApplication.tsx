
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/utils/auth";

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface VendorApplication {
  id: string;
  vendor_id: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useVendorApplication = () => {
  const { user } = useAuth();
  const { vendorId, isElikaAdmin } = useUserRole();
  const { toast } = useToast();
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && vendorId) {
      fetchApplication();
    } else {
      setLoading(false);
    }
  }, [user, vendorId]);

  const fetchApplication = async () => {
    if (!vendorId) return;

    try {
      console.log('Fetching vendor application for vendor:', vendorId);
      
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/vendors/${vendorId}/application`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vendor application fetched:', data);
        setApplication(data.application || null);
      } else if (response.status !== 404) {
        throw new Error('Failed to fetch application');
      }
    } catch (error) {
      console.error('Error fetching vendor application:', error);
      toast({
        title: "Error",
        description: "Failed to fetch application status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async () => {
    const token = getToken();
    if (!vendorId || !token) {
      toast({
        title: "Error",
        description: "Authentication information not available",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Submitting vendor application for vendor:', vendorId);

      const response = await fetch(`/api/vendors/${vendorId}/application/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const data = await response.json();
      console.log('Application submitted successfully:', data);
      setApplication(data.application);
      
      toast({
        title: "Application Submitted",
        description: "Your vendor application has been submitted for review.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateApplicationStatus = async (
    applicationId: string, 
    status: ApplicationStatus, 
    reviewNotes?: string
  ) => {
    if (!isElikaAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can update application status",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Updating application status:', applicationId, status);

      const token = getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/vendors/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application status');
      }

      console.log('Application status updated successfully');
      
      toast({
        title: "Application Updated",
        description: `Application status updated to ${status}`,
      });

      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update application status",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    application,
    loading,
    submitApplication,
    updateApplicationStatus,
    refetch: fetchApplication
  };
};
