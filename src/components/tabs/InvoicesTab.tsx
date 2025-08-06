
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Filter, Eye, FileText, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const InvoicesTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const invoices = [
    {
      id: "INV-001",
      invoiceNumber: "INV-2024-001",
      candidateName: "John Doe",
      jobTitle: "Senior React Developer",
      amount: 50000,
      status: "pending",
      submittedDate: "Dec 10, 2024",
      dueDate: "Dec 25, 2024",
      jobId: "JD001"
    },
    {
      id: "INV-002",
      invoiceNumber: "INV-2024-002",
      candidateName: "Jane Smith",
      jobTitle: "DevOps Engineer",
      amount: 45000,
      status: "approved",
      submittedDate: "Dec 12, 2024",
      dueDate: "Dec 27, 2024",
      jobId: "JD002"
    }
  ];

  const handleCreateInvoice = () => {
    navigate("/invoice-upload");
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/invoice-upload?invoiceId=${invoiceId}&mode=edit`);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download",
      description: "Downloading invoice...",
    });
    // Would trigger file download
  };

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filter options would open here",
    });
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "approved": return "default";
      case "paid": return "outline";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search invoices..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleFilter}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" onClick={handleCreateInvoice}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="bg-gradient-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">{invoice.candidateName} • {invoice.jobTitle}</p>
                </div>
                <Badge variant={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <span className="text-muted-foreground">Amount: ₹{invoice.amount.toLocaleString()}</span>
                <span className="text-muted-foreground">Job ID: {invoice.jobId}</span>
                <span className="text-muted-foreground">Submitted: {invoice.submittedDate}</span>
                <span className="text-muted-foreground">Due: {invoice.dueDate}</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" onClick={() => handleViewInvoice(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Invoice Details - {invoice.invoiceNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Invoice Information</h4>
                          <p className="text-sm text-muted-foreground">Invoice #: {invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">Amount: ₹{invoice.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Status: {invoice.status}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Candidate Details</h4>
                          <p className="text-sm text-muted-foreground">Name: {invoice.candidateName}</p>
                          <p className="text-sm text-muted-foreground">Position: {invoice.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">Job ID: {invoice.jobId}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Dates</h4>
                        <p className="text-sm text-muted-foreground">Submitted: {invoice.submittedDate}</p>
                        <p className="text-sm text-muted-foreground">Due Date: {invoice.dueDate}</p>
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button onClick={() => handleDownloadInvoice(invoice.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
