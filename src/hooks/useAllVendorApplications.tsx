
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { ApplicationStatus } from "@/hooks/useVendorApplication";

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
      
      // Set up real-time subscription
      const channel = supabase
        .channel('vendor-applications-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendor_applications'
          },
          () => {
            console.log('Vendor application change detected, refetching...');
            fetchApplications();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendor_documents'
          },
          () => {
            console.log('Vendor document change detected, refetching...');
            fetchApplications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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

      // First get all vendors with created_at and updated_at
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name, email, status, created_at, updated_at');

      if (vendorsError) {
        console.error('Error fetching vendors:', vendorsError);
        throw vendorsError;
      }

      // Get all applications
      const { data: applications, error: applicationsError } = await supabase
        .from('vendor_applications')
        .select('*');

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
        throw applicationsError;
      }

      // Get document stats for each vendor with document_type
      const { data: documentStats, error: docsError } = await supabase
        .from('vendor_documents')
        .select('vendor_id, status, document_type');

      if (docsError) {
        console.error('Error fetching document stats:', docsError);
        throw docsError;
      }

      // Combine the data
      const combinedData: VendorApplicationWithDetails[] = vendors?.map(vendor => {
        const application = applications?.find(app => app.vendor_id === vendor.id);
        const vendorDocs = documentStats?.filter(doc => doc.vendor_id === vendor.id) || [];
        const totalDocs = vendorDocs.length;
        const approvedDocs = vendorDocs.filter(doc => doc.status === 'approved').length;
        const mandatoryDocs = vendorDocs.filter(doc => 
          (doc.status === 'approved') && 
          ['nda', 'gst_certificate'].includes(doc.document_type)
        );
        const mandatoryDocsApproved = mandatoryDocs.length === 2;

        return {
          id: application?.id || `temp-${vendor.id}`,
          vendor_id: vendor.id,
          status: application?.status || 'draft',
          submitted_at: application?.submitted_at || null,
          reviewed_at: application?.reviewed_at || null,
          reviewed_by: application?.reviewed_by || null,
          review_notes: application?.review_notes || null,
          created_at: application?.created_at || vendor.created_at,
          updated_at: application?.updated_at || vendor.updated_at,
          vendor_name: vendor.name,
          vendor_email: vendor.email,
          vendor_status: vendor.status,
          total_documents: totalDocs,
          approved_documents: approvedDocs,
          mandatory_documents_approved: mandatoryDocsApproved
        };
      }) || [];

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
