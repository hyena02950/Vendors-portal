
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BulkDocumentActions } from "./BulkDocumentActions";
import { DocumentVersionHistory } from "./DocumentVersionHistory";
import { AutomatedReminders } from "./AutomatedReminders";
import { WorkflowStatusManager } from "./WorkflowStatusManager";
import { getToken } from "@/utils/auth";

type DocumentType = 'msa' | 'nda' | 'incorporation_certificate' | 'gst_certificate' | 'shop_act_license' | 'msme_registration';

interface VendorDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  uploaded_at: string;
  vendor_id: string;
  vendor?: {
    name: string;
  };
}

const DOCUMENT_LABELS: Record<string, string> = {
  'msa': 'Master Service Agreement (MSA)',
  'nda': 'Non-Disclosure Agreement (NDA)', 
  'incorporation_certificate': 'Incorporation Certificate (CIN)',
  'gst_certificate': 'GST Certificate',
  'shop_act_license': 'Shop Act License',
  'msme_registration': 'MSME Registration',
};

export const VendorDocumentApproval = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchDocuments = async () => {
    try {
      console.log('Fetching all vendor documents for review...');
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching documents');
        toast({
          title: "Error",
          description: "Failed to fetch documents for review",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log('Documents fetched for review:', data);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentReview = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      console.log('Reviewing document:', documentId, 'Status:', status);
      
      const token = getToken();
      if (!token) {
        toast({
          title: "Error", 
          description: "You must be logged in to review documents",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/vendors/documents/${documentId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          reviewNotes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to review document');
      }

      toast({
        title: "Document Reviewed",
        description: `Document has been ${status}`,
      });

      // Clear review notes for this document
      setReviewNotes(prev => ({ ...prev, [documentId]: '' }));
      
      // Refresh documents list
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error reviewing document:', error);
      toast({
        title: "Review Failed",
        description: `Failed to ${status} document: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  const pendingDocuments = documents.filter(doc => doc.status === 'pending');
  const reviewedDocuments = documents.filter(doc => doc.status !== 'pending');

  const isValidDocumentType = (type: string): type is DocumentType => {
    return ['msa', 'nda', 'incorporation_certificate', 'gst_certificate', 'shop_act_license', 'msme_registration'].includes(type);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Review Dashboard</CardTitle>
          <p className="text-muted-foreground">
            Review and approve vendor onboarding documents with enhanced workflow management
          </p>
        </CardHeader>
      </Card>

      {/* Workflow Status Overview */}
      <WorkflowStatusManager />

      {/* Automated Reminders */}
      <AutomatedReminders />

      {/* Bulk Actions for Pending Documents */}
      {pendingDocuments.length > 0 && (
        <BulkDocumentActions 
          documents={pendingDocuments} 
          onRefresh={fetchDocuments} 
        />
      )}

      {/* Pending Documents */}
      {pendingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">
              Pending Review ({pendingDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <div className="font-medium">
                          {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.vendor?.name} • {doc.file_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(doc.status)}
                      {isValidDocumentType(doc.document_type) && (
                        <DocumentVersionHistory 
                          documentType={doc.document_type}
                          vendorId={doc.vendor_id}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{doc.file_name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <iframe
                              src={doc.file_url}
                              className="w-full h-96 border rounded"
                              title={doc.file_name}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                    
                    <Textarea
                      placeholder="Add review notes (optional)"
                      value={reviewNotes[doc.id] || ''}
                      onChange={(e) => setReviewNotes(prev => ({ ...prev, [doc.id]: e.target.value }))}
                      className="min-h-[60px]"
                    />
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleDocumentReview(doc.id, 'approved', reviewNotes[doc.id])}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDocumentReview(doc.id, 'rejected', reviewNotes[doc.id])}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Reviewed Documents */}
      {reviewedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Reviewed Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {reviewedDocuments.slice(0, 10).map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <div className="font-medium">
                          {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {doc.vendor?.name} • {doc.file_name}
                        </div>
                        {doc.review_notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Notes: {doc.review_notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(doc.status)}
                      {isValidDocumentType(doc.document_type) && (
                        <DocumentVersionHistory 
                          documentType={doc.document_type}
                          vendorId={doc.vendor_id}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents found for review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
