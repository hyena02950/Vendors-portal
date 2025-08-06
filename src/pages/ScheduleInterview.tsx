
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ScheduleInterview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    interviewDate: "",
    interviewTime: "",
    interviewType: "",
    interviewer: "",
    location: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const candidateId = searchParams.get("candidateId");
    const jobId = searchParams.get("jobId");
    if (candidateId) {
      setFormData(prev => ({ ...prev, candidateId }));
    }
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
          description: "You must be logged in to schedule an interview",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time for interview_date
      const interviewDateTime = new Date(`${formData.interviewDate}T${formData.interviewTime}`).toISOString();

      // Insert interview data - match the actual database schema
      const { data, error } = await (supabase as any)
        .from('interviews')
        .insert([
          {
            vendor_id: user.id,
            candidate_id: formData.candidateId || null,
            interview_date: interviewDateTime,
            interview_type: formData.interviewType,
            interviewer: formData.interviewer,
            status: 'scheduled',
            feedback: formData.notes || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Interview scheduled successfully",
      });

      // Reset form and navigate back
      setFormData({
        candidateId: "",
        jobId: "",
        interviewDate: "",
        interviewTime: "",
        interviewType: "",
        interviewer: "",
        location: "",
        notes: "",
      });
      navigate("/dashboard?tab=interviews");
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard?tab=interviews");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Interview</CardTitle>
          {formData.candidateId && (
            <p className="text-sm text-muted-foreground">
              Scheduling for Candidate ID: {formData.candidateId}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidateId">Candidate ID</Label>
                <Input
                  id="candidateId"
                  placeholder="Enter Candidate ID"
                  value={formData.candidateId}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                />
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewType">Interview Type</Label>
              <Select value={formData.interviewType} onValueChange={(value) => setFormData(prev => ({ ...prev, interviewType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewDate">Interview Date</Label>
                <Input
                  id="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewTime">Interview Time</Label>
                <Input
                  id="interviewTime"
                  type="time"
                  value={formData.interviewTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewer">Interviewer</Label>
              <Input
                id="interviewer"
                placeholder="Enter interviewer name"
                value={formData.interviewer}
                onChange={(e) => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location/Meeting Link</Label>
              <Input
                id="location"
                placeholder="Meeting room or video call link"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or instructions"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Interview"}
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

export default ScheduleInterview;
