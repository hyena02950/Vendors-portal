import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { History, Eye, Download, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getToken } from "@/utils/auth";

interface DocumentVersion {
  _id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  status: string;
  reviewNotes?: string;
  reviewedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  reviewedAt?: Date;
  uploadedAt: Date;
  version?: number; // This will be added in the component
}

type DocumentType = 'msa' | 'nda' | 'incorporation_certificate' | 'gst_certificate' | 'shop_act_license' | 'msme_registration';

interface DocumentVersionHistoryProps {
  documentType: DocumentType;
  vendorId: string;
}

export const DocumentVersionHistory = ({ documentType, vendorId }: DocumentVersionHistoryProps) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersionHistory = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`/api/vendors/${vendorId}/documents?type=${documentType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      const data = await response.json();
      
      // Filter documents by type and add version numbers
      const filteredDocuments = data.vendor?.documents
        ?.filter((doc: any) => doc.documentType === documentType)
        ?.map((doc: any, index: number, array: any[]) => ({
          ...doc,
          version: array.length - index,
        })) || [];

      setVersions(filteredDocuments);
    } catch (error: any) {
      console.error('Error fetching version history:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersionHistory();
  }, [documentType, vendorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadDocument = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (versions.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Version History ({versions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Version History - {documentType.replace(/_/g, ' ')}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-4">Loading version history...</div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <Card key={version._id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono">
                        v{version.version}
                      </Badge>
                      <div>
                        <div className="font-medium">{version.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Uploaded: {new Date(version.uploadedAt).toLocaleString()}
                        </div>
                        {version.reviewedAt && (
                          <div className="text-sm text-muted-foreground">
                            Reviewed: {new Date(version.reviewedAt).toLocaleString()}
                            {version.reviewedBy?.name && ` by ${version.reviewedBy.name}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(version.status)}>
                      {version.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {version.reviewNotes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
                      <strong>Review Notes:</strong> {version.reviewNotes}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(version.fileUrl)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(version.fileUrl, version.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};