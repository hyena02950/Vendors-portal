
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

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
      
      const { data, error } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching vendor application:', error);
        throw error;
      }

      console.log('Vendor application fetched:', data);
      setApplication(data || null);
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
    if (!vendorId || !user) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Submitting vendor application for vendor:', vendorId);

      const applicationData = {
        vendor_id: vendorId,
        status: 'submitted' as ApplicationStatus,
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vendor_applications')
        .upsert(applicationData, {
          onConflict: 'vendor_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting application:', error);
        throw error;
      }

      console.log('Application submitted successfully:', data);
      setApplication(data);
      
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

      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (reviewNotes) {
        updateData.review_notes = reviewNotes;
      }

      const { data, error } = await supabase
        .from('vendor_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating application status:', error);
        throw error;
      }

      console.log('Application status updated:', data);
      
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
