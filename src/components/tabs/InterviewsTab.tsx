
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Filter, Calendar, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const InterviewsTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackData, setFeedbackData] = useState({ rating: "", feedback: "", recommendation: "" });

  const interviews = [
    {
      id: "INT-001",
      candidateName: "John Doe",
      jobTitle: "Senior React Developer",
      interviewType: "Technical",
      date: "Dec 15, 2024",
      time: "10:00 AM",
      interviewer: "Sarah Wilson",
      status: "scheduled",
      location: "Conference Room A"
    },
    {
      id: "INT-002",
      candidateName: "Jane Smith",
      jobTitle: "DevOps Engineer",
      interviewType: "HR",
      date: "Dec 16, 2024",
      time: "2:00 PM",
      interviewer: "Mark Johnson",
      status: "completed",
      location: "Video Call"
    }
  ];

  const handleScheduleInterview = () => {
    navigate("/schedule-interview");
  };

  const handleReschedule = (interviewId: string) => {
    navigate(`/schedule-interview?interviewId=${interviewId}&mode=reschedule`);
  };

  const handleSubmitFeedback = async (interviewId: string) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully",
        });
        setFeedbackData({ rating: "", feedback: "", recommendation: "" });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to submit feedback",
        variant: "destructive",
      });
    }
  };

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filter options would open here",
    });
  };

  const filteredInterviews = interviews.filter(interview =>
    interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search interviews..." 
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
          <Button size="sm" onClick={handleScheduleInterview}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredInterviews.map((interview) => (
          <Card key={interview.id} className="bg-gradient-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{interview.candidateName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{interview.jobTitle} • {interview.interviewType}</p>
                </div>
                <Badge variant={getStatusColor(interview.status)}>
                  {interview.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <span className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {interview.date}
                </span>
                <span className="flex items-center text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {interview.time}
                </span>
                <span className="text-muted-foreground">Interviewer: {interview.interviewer}</span>
                <span className="text-muted-foreground">Location: {interview.location}</span>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleReschedule(interview.id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
                {interview.status === "completed" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Interview Feedback - {interview.candidateName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="rating" className="text-sm font-medium">Rating (1-5)</label>
                          <Input
                            id="rating"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Rate the candidate"
                            value={feedbackData.rating}
                            onChange={(e) => setFeedbackData(prev => ({ ...prev, rating: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="feedback" className="text-sm font-medium">Feedback</label>
                          <Textarea
                            id="feedback"
                            placeholder="Enter your feedback about the candidate"
                            value={feedbackData.feedback}
                            onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="recommendation" className="text-sm font-medium">Recommendation</label>
                          <select
                            id="recommendation"
                            value={feedbackData.recommendation}
                            onChange={(e) => setFeedbackData(prev => ({ ...prev, recommendation: e.target.value }))}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          >
                            <option value="">Select recommendation</option>
                            <option value="proceed">Proceed to next round</option>
                            <option value="reject">Reject</option>
                            <option value="hold">Hold for later</option>
                          </select>
                        </div>
                        <Button onClick={() => handleSubmitFeedback(interview.id)} className="w-full">
                          Submit Feedback
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
