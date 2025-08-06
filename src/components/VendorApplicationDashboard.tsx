
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAllVendorApplications } from "@/hooks/useAllVendorApplications";
import { useVendorApplication, ApplicationStatus } from "@/hooks/useVendorApplication";
import { CheckCircle, XCircle, Clock, FileText, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";

const ApplicationStatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const variants = {
    draft: { variant: "outline" as const, color: "text-gray-600", label: "Draft" },
    submitted: { variant: "secondary" as const, color: "text-blue-600", label: "Submitted" },
    under_review: { variant: "secondary" as const, color: "text-yellow-600", label: "Under Review" },
    approved: { variant: "default" as const, color: "text-green-600", label: "Approved" },
    rejected: { variant: "destructive" as const, color: "text-red-600", label: "Rejected" }
  };

  const config = variants[status];
  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
};

const ApplicationReviewDialog = ({ 
  applicationId, 
  currentStatus, 
  vendorName, 
  onStatusUpdate 
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  vendorName: string;
  onStatusUpdate: () => void;
}) => {
  const { updateApplicationStatus } = useVendorApplication();
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(currentStatus);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await updateApplicationStatus(applicationId, newStatus, reviewNotes);
    if (success) {
      onStatusUpdate();
    }
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Application - {vendorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Current Status</Label>
            <div className="mt-1">
              <ApplicationStatusBadge status={currentStatus} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="status">New Status</Label>
            <select
              id="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Review Notes</Label>
            <Textarea
              id="notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add review notes..."
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const VendorApplicationDashboard = () => {
  const { applications, loading, refetch } = useAllVendorApplications();

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'submitted':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const filterApplications = (status: ApplicationStatus | 'all') => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'submitted').length,
    under_review: applications.filter(app => app.status === 'under_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Applications</h2>
          <p className="text-muted-foreground">Manage vendor onboarding applications and document reviews</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <div className="text-sm text-muted-foreground">Submitted</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.under_review}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="under_review">Under Review ({stats.under_review})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        {(['all', 'submitted', 'under_review', 'approved', 'rejected'] as const).map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid gap-4">
              {filterApplications(status).map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(app.status)}
                        <div>
                          <div className="font-semibold">{app.vendor_name}</div>
                          <div className="text-sm text-muted-foreground">{app.vendor_email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          Documents: {app.approved_documents}/{app.total_documents} approved
                          {app.mandatory_documents_approved && (
                            <Badge variant="outline" className="ml-2 text-green-600">
                              Mandatory Complete
                            </Badge>
                          )}
                        </div>
                        
                        <ApplicationStatusBadge status={app.status} />
                        
                        {app.status !== 'draft' && (
                          <ApplicationReviewDialog
                            applicationId={app.id}
                            currentStatus={app.status}
                            vendorName={app.vendor_name}
                            onStatusUpdate={refetch}
                          />
                        )}
                      </div>
                    </div>
                    
                    {app.submitted_at && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        Submitted: {format(new Date(app.submitted_at), 'PPP p')}
                      </div>
                    )}
                    
                    {app.review_notes && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <div className="text-sm font-medium">Review Notes:</div>
                        <div className="text-sm text-muted-foreground mt-1">{app.review_notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filterApplications(status).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No applications found for this status</div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
