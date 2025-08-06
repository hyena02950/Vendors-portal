
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { History, Eye, Download, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DocumentVersion {
  id: string;
  version: number;
  file_name: string;
  file_url: string;
  status: string;
  uploaded_at: string;
  review_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
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
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('document_type', documentType)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Add version numbers based on upload order
      const versionsWithNumbers = data?.map((doc, index) => ({
        ...doc,
        version: data.length - index,
      })) || [];

      setVersions(versionsWithNumbers);
    } catch (error: any) {
      console.error('Error fetching version history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch version history",
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
          <DialogTitle>Document Version History - {documentType}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-4">Loading version history...</div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <Card key={version.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono">
                        v{version.version}
                      </Badge>
                      <div>
                        <div className="font-medium">{version.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Uploaded: {new Date(version.uploaded_at).toLocaleString()}
                        </div>
                        {version.reviewed_at && (
                          <div className="text-sm text-muted-foreground">
                            Reviewed: {new Date(version.reviewed_at).toLocaleString()}
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
                  {version.review_notes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
                      <strong>Review Notes:</strong> {version.review_notes}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(version.file_url)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(version.file_url, version.file_name)}
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
