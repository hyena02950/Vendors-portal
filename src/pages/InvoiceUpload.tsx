
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InvoiceUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    jobId: "",
    candidateName: "",
    amount: "",
    invoice: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload an invoice",
          variant: "destructive",
        });
        return;
      }

      // Verify job exists
      const { data: jobData } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('id', formData.jobId)
        .single();

      if (!jobData) {
        toast({
          title: "Error",
          description: "Invalid job ID",
          variant: "destructive",
        });
        return;
      }

      // Insert invoice data using correct column names
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            vendor_id: user.id,
            invoice_number: formData.invoiceNumber,
            job_id: formData.jobId,
            candidate_name: formData.candidateName,
            amount: parseFloat(formData.amount),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice uploaded successfully",
      });

      // Reset form and navigate back
      setFormData({
        invoiceNumber: "",
        jobId: "",
        candidateName: "",
        amount: "",
        invoice: null,
      });
      navigate("/dashboard?tab=invoices");
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard?tab=invoices");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobId">Job ID</Label>
                <Input
                  id="jobId"
                  placeholder="JOB-001"
                  value={formData.jobId}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Name</Label>
                <Input
                  id="candidateName"
                  placeholder="Enter candidate name"
                  value={formData.candidateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice File (PDF) - Optional</Label>
              <Input
                id="invoice"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData(prev => ({ ...prev, invoice: e.target.files?.[0] || null }))}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Uploading..." : "Upload Invoice"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceUpload;
