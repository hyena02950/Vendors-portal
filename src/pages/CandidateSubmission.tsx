import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/utils/auth";

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
      const token = getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a candidate",
          variant: "destructive",
        });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('jobId', formData.jobId);
      formDataToSend.append('candidateName', formData.candidateName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('linkedIn', formData.linkedIn);
      formDataToSend.append('currentCTC', formData.currentCTC);
      formDataToSend.append('expectedCTC', formData.expectedCTC);
      formDataToSend.append('skills', formData.skills);
      formDataToSend.append('experience', formData.experience);
      
      if (formData.resume) {
        formDataToSend.append('resume', formData.resume);
      }

      const response = await fetch('/api/candidates/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit candidate');
      }

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