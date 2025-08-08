import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useVendorApplication } from "@/hooks/useVendorApplication";
import { NewVendorRegistration } from "./NewVendorRegistration";
import { VendorApplicationDashboard } from "./VendorApplicationDashboard";
import { Upload, FileText, CheckCircle, XCircle, Clock, RefreshCw, Send } from "lucide-react";
import { getToken } from "@/utils/auth";

type DocumentTypeEnum = 'msa' | 'nda' | 'incorporation_certificate' | 'gst_certificate' | 'shop_act_license' | 'msme_registration';

interface DocumentType {
  type: DocumentTypeEnum;
  label: string;
  required: boolean;
  mandatory: boolean; // Hidden from vendors but used for validation
}

const REQUIRED_DOCUMENTS: DocumentType[] = [
  { type: 'msa', label: 'Master Service Agreement (MSA)', required: true, mandatory: false },
  { type: 'nda', label: 'Non-Disclosure Agreement (NDA)', required: true, mandatory: true },
  { type: 'incorporation_certificate', label: 'Incorporation Certificate (CIN)', required: true, mandatory: false },
  { type: 'gst_certificate', label: 'GST Certificate', required: true, mandatory: true },
  { type: 'shop_act_license', label: 'Shop Act License', required: true, mandatory: false },
  { type: 'msme_registration', label: 'MSME Registration', required: false, mandatory: false },
];

interface VendorDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  uploaded_at: string;
}

interface VendorInfo {
  id: string;
  name: string;
  status: string;
}

export const VendorOnboarding = () => {
  const { user } = useAuth();
  const { vendorId, isElikaAdmin, loading: roleLoading } = useUserRole();
  const { application, loading: appLoading, submitApplication } = useVendorApplication();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);

  console.log('VendorOnboarding - User:', user?.id, 'VendorId:', vendorId, 'IsAdmin:', isElikaAdmin, 'Application:', application);

  useEffect(() => {
    if (user && !roleLoading) {
      if (isElikaAdmin) {
        fetchVendors();
      } else if (vendorId) {
        setSelectedVendor(vendorId);
        fetchVendorInfo(vendorId);
        fetchDocuments(vendorId);
      }
    }
  }, [user, vendorId, isElikaAdmin, roleLoading]);

  useEffect(() => {
    if (selectedVendor && isElikaAdmin) {
      fetchVendorInfo(selectedVendor);
      fetchDocuments(selectedVendor);
    }
  }, [selectedVendor, isElikaAdmin]);

  const fetchVendorInfo = async (currentVendorId: string) => {
    try {
      console.log('Fetching vendor info for:', currentVendorId);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/vendors/${currentVendorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vendor info fetched:', data);
        setVendorInfo(data);
      } else {
        console.error('Error fetching vendor info');
      }
    } catch (error) {
      console.error('Error fetching vendor info:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      console.log('Fetching vendors...');
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching vendors');
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log('Vendors fetched successfully:', data);
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchDocuments = async (currentVendorId: string) => {
    if (!user || !currentVendorId) return;
    
    setRefreshing(true);
    try {
      console.log('Fetching documents for vendor:', currentVendorId);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/vendors/${currentVendorId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching documents');
        toast({
          title: "Error",
          description: "Failed to fetch documents",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log('Documents fetched:', data);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    const token = getToken();
    if (!token || !selectedVendor) {
      toast({
        title: "Error",
        description: "Authentication or vendor information not available.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, DOCX, JPG, or PNG file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(documentType);

    try {
      console.log('Starting file upload for document type:', documentType);
      
      const formDataToSend = new FormData();
      formDataToSend.append('documentType', documentType);
      formDataToSend.append('document', file);
      formDataToSend.append('vendorId', selectedVendor);

      const response = await fetch('/api/vendors/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully and is pending review.`,
      });

      // Refresh documents list
      await fetchDocuments(selectedVendor);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload document: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    const success = await submitApplication();
    if (success) {
      // Refresh to get updated application status
      await fetchDocuments(selectedVendor);
      await fetchVendorInfo(selectedVendor);
    }
    setSubmitting(false);
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.status || null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  const uploadedCount = REQUIRED_DOCUMENTS.filter(doc => 
    documents.some(d => d.document_type === doc.type)
  ).length;
  const mandatoryDocsApproved = REQUIRED_DOCUMENTS.filter(doc => 
    doc.mandatory && documents.some(d => d.document_type === doc.type && d.status === 'approved')
  ).length === REQUIRED_DOCUMENTS.filter(doc => doc.mandatory).length;
  
  const progress = (uploadedCount / REQUIRED_DOCUMENTS.length) * 100;
  const canSubmitApplication = uploadedCount === REQUIRED_DOCUMENTS.length && !application;

  // Show loading state
  if (roleLoading || appLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show admin dashboard for Elika admins
  if (isElikaAdmin) {
    return <VendorApplicationDashboard />;
  }

  // Show vendor registration form for new users (no vendor ID and not admin)
  if (!vendorId) {
    console.log('Showing vendor registration form');
    return (
      <div className="space-y-6">
        <NewVendorRegistration onVendorCreated={(newVendorId) => {
          setSelectedVendor(newVendorId);
          // Refresh the page to update user roles
          window.location.reload();
        }} />
      </div>
    );
  }

  // Show success message for activated vendors
  if (vendorInfo?.status === 'active') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span>Vendor Account Activated!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Congratulations!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your vendor account has been successfully activated. You can now access all vendor features and start working on assigned projects.
                </p>
              </div>
              
              {application && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Application Status:</div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {application.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vendor Onboarding - Document Upload</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments(selectedVendor)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress: {uploadedCount}/{REQUIRED_DOCUMENTS.length} documents uploaded</span>
              <div className="flex items-center space-x-2">
                {vendorInfo && (
                  <Badge variant="outline">
                    Vendor Status: {vendorInfo.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
                {application && (
                  <Badge variant="outline">
                    Application Status: {application.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const status = getDocumentStatus(doc.type);
              const document = documents.find(d => d.document_type === doc.type);
              
              return (
                <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <div>
                      <div className="font-medium">{doc.label}</div>
                      {document?.review_notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Review Notes: {document.review_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(status)}
                    
                    {/* Only show upload button if application not submitted */}
                    {(!application || application.status === 'draft') && (
                      <div>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          className="hidden"
                          id={`file-${doc.type}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log('File selected for upload:', file.name, file.type, file.size);
                              handleFileUpload(doc.type, file);
                            }
                          }}
                          disabled={uploading === doc.type}
                        />
                        <Label htmlFor={`file-${doc.type}`} className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading === doc.type}
                            asChild
                          >
                            <span>
                              {uploading === doc.type ? (
                                <>
                                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {status ? 'Replace' : 'Upload'}
                                </>
                              )}
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Application Status Messages */}
          {application?.status === 'submitted' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Application Submitted!</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your application has been submitted for review. We'll notify you once it's been processed.
              </p>
            </div>
          )}

          {application?.status === 'under_review' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Application Under Review</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Your application is currently being reviewed by our team.
              </p>
            </div>
          )}

          {application?.status === 'approved' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Application Approved!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Congratulations! Your vendor account has been approved and is now active.
              </p>
            </div>
          )}

          {application?.status === 'rejected' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Application Rejected</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Your application has been rejected. Please review the feedback and resubmit with necessary changes.
              </p>
              {application.review_notes && (
                <div className="mt-2 p-2 bg-red-100 rounded">
                  <div className="text-sm font-medium text-red-800">Review Notes:</div>
                  <div className="text-sm text-red-700">{application.review_notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Submit Application Button */}
          {canSubmitApplication && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-blue-700 mb-3">
                  All documents have been uploaded. You can now submit your application for review.
                </p>
                <Button 
                  onClick={handleSubmitApplication} 
                  disabled={submitting}
                  className="w-full max-w-md"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application for Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
