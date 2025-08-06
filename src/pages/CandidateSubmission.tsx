
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CandidateSubmission = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    jobId: "",
    candidateName: "",
    email: "",
    phone: "",
    linkedIn: "",
    currentCTC: "",
    expectedCTC: "",
    skills: "",
    experience: "",
    resume: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId) {
      setFormData(prev => ({ ...prev, jobId }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a candidate",
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

      // Insert candidate data using correct column names
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            vendor_id: user.id,
            job_id: formData.jobId,
            name: formData.candidateName,
            email: formData.email,
            phone: formData.phone,
            experience_years: parseInt(formData.experience),
            notice_period: "30 days", // Default value since it's required
            status: 'submitted'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate submitted successfully",
      });

      // Reset form and navigate back
      setFormData({
        jobId: "",
        candidateName: "",
        email: "",
        phone: "",
        linkedIn: "",
        currentCTC: "",
        expectedCTC: "",
        skills: "",
        experience: "",
        resume: null,
      });
      navigate("/dashboard?tab=candidates");
    } catch (error: any) {
      console.error('Error submitting candidate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit candidate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Candidate</CardTitle>
          {formData.jobId && (
            <p className="text-sm text-muted-foreground">
              Submitting for Job ID: {formData.jobId}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobId">Job ID</Label>
                <Input
                  id="jobId"
                  placeholder="Enter Job ID"
                  value={formData.jobId}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
                  required
                />
              </div>
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="candidate@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input
                id="experience"
                type="number"
                placeholder="5"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume (PDF) - Optional</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFormData(prev => ({ ...prev, resume: e.target.files?.[0] || null }))}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Submitting..." : "Submit Candidate"}
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

export default CandidateSubmission;
