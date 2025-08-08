
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { getToken } from "@/utils/auth";

interface BulkDocumentActionsProps {
  documents: any[];
  onRefresh: () => void;
}

export const BulkDocumentActions = ({ documents, onRefresh }: BulkDocumentActionsProps) => {
  const { toast } = useToast();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [bulkNotes, setBulkNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected' | null>(null);

  const pendingDocs = documents.filter(doc => doc.status === 'pending');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(pendingDocs.map(doc => doc.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs(prev => [...prev, docId]);
    } else {
      setSelectedDocs(prev => prev.filter(id => id !== docId));
    }
  };

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedDocs.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select documents to process",
        variant: "destructive",
      });
      return;
    }

    setBulkAction(action);
    setShowBulkDialog(true);
  };

  const processBulkAction = async () => {
    if (!bulkAction) return;
    
    setIsProcessing(true);
    try {
      const token = getToken();
      if (!token) throw new Error('User not authenticated');

      // Process bulk action via API
      const response = await fetch('/api/vendors/documents/bulk-review', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocs,
          status: bulkAction,
          reviewNotes: bulkNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process bulk action');
      }

      toast({
        title: "Bulk Action Completed",
        description: `${selectedDocs.length} documents have been ${bulkAction}`,
      });

      setSelectedDocs([]);
      setBulkNotes('');
      setShowBulkDialog(false);
      setBulkAction(null);
      onRefresh();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast({
        title: "Bulk Action Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingDocs.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 border rounded-lg bg-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={selectedDocs.length === pendingDocs.length}
            onCheckedChange={handleSelectAll}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">
            Select All ({pendingDocs.length} pending documents)
          </span>
          {selectedDocs.length > 0 && (
            <Badge variant="secondary">
              {selectedDocs.length} selected
            </Badge>
          )}
        </div>
      </div>

      {selectedDocs.length > 0 && (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleBulkAction('approved')}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Bulk Approve ({selectedDocs.length})
          </Button>
          <Button
            onClick={() => handleBulkAction('rejected')}
            variant="destructive"
            size="sm"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Bulk Reject ({selectedDocs.length})
          </Button>
          <Button
            onClick={() => setSelectedDocs([])}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      )}

      <div className="mt-4">
        <div className="grid gap-2">
          {pendingDocs.map((doc) => (
            <div key={doc.id} className="flex items-center space-x-3 p-2 border rounded">
              <Checkbox
                checked={selectedDocs.includes(doc.id)}
                onCheckedChange={(checked) => handleSelectDoc(doc.id, checked as boolean)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <span className="text-sm font-medium">{doc.file_name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {doc.vendor?.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkAction === 'approved' ? 'Approve' : 'Reject'} Documents
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to {bulkAction === 'approved' ? 'approve' : 'reject'} {selectedDocs.length} documents.
            </p>
            <Textarea
              placeholder="Add notes for all selected documents (optional)"
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processBulkAction}
              disabled={isProcessing}
              className={bulkAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={bulkAction === 'rejected' ? 'destructive' : 'default'}
            >
              {isProcessing ? 'Processing...' : `${bulkAction === 'approved' ? 'Approve' : 'Reject'} ${selectedDocs.length} Documents`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
