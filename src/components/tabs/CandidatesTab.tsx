
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Filter, Eye, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CandidatesTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const candidates = [
    {
      id: "CAND-001",
      name: "John Doe",
      email: "john@example.com",
      phone: "+91-9876543210",
      jobId: "JD001",
      jobTitle: "Senior React Developer",
      status: "pending",
      experience: "5 years",
      currentCTC: "12 LPA",
      expectedCTC: "18 LPA",
      submittedDate: "Dec 10, 2024",
      skills: ["React", "TypeScript", "Node.js"]
    },
    {
      id: "CAND-002",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+91-9876543211",
      jobId: "JD002",
      jobTitle: "DevOps Engineer",
      status: "shortlisted",
      experience: "4 years",
      currentCTC: "10 LPA",
      expectedCTC: "16 LPA",
      submittedDate: "Dec 12, 2024",
      skills: ["Docker", "Kubernetes", "AWS"]
    }
  ];

  const handleAddCandidate = () => {
    navigate("/submit-candidate");
  };

  const handleViewProfile = (candidate: any) => {
    setSelectedCandidate(candidate);
  };

  const handleScheduleInterview = (candidateId: string) => {
    navigate(`/schedule-interview?candidateId=${candidateId}`);
  };

  const handleViewResume = (candidateId: string) => {
    toast({
      title: "Resume",
      description: "Opening resume viewer...",
    });
    // Would open resume in new tab/modal
  };

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filter options would open here",
    });
  };

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "shortlisted": return "default";
      case "interviewed": return "outline";
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
            placeholder="Search candidates..." 
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
          <Button size="sm" onClick={handleAddCandidate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="bg-gradient-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{candidate.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{candidate.jobTitle} • {candidate.experience}</p>
                </div>
                <Badge variant={getStatusColor(candidate.status)}>
                  {candidate.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <span className="text-muted-foreground">Current CTC: {candidate.currentCTC}</span>
                <span className="text-muted-foreground">Expected CTC: {candidate.expectedCTC}</span>
                <span className="text-muted-foreground">Email: {candidate.email}</span>
                <span className="text-muted-foreground">Submitted: {candidate.submittedDate}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" onClick={() => handleViewProfile(candidate)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{candidate.name} - Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Contact Information</h4>
                          <p className="text-sm text-muted-foreground">Email: {candidate.email}</p>
                          <p className="text-sm text-muted-foreground">Phone: {candidate.phone}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Job Details</h4>
                          <p className="text-sm text-muted-foreground">Position: {candidate.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">Job ID: {candidate.jobId}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Experience & Salary</h4>
                        <p className="text-sm text-muted-foreground">Experience: {candidate.experience}</p>
                        <p className="text-sm text-muted-foreground">Current CTC: {candidate.currentCTC}</p>
                        <p className="text-sm text-muted-foreground">Expected CTC: {candidate.expectedCTC}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => handleScheduleInterview(candidate.id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewResume(candidate.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
