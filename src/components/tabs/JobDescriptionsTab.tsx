import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Filter, Users, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const JobDescriptionsTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const jobDescriptions = [
    {
      id: "JD001",
      title: "Senior React Developer",
      company: "TechCorp Solutions",
      location: "Bangalore",
      experience: "5-8 years",
      status: "active",
      candidates: 8,
      deadline: "Dec 15, 2024",
      skills: ["React", "TypeScript", "Node.js", "AWS"],
      description: "Looking for an experienced React developer to join our team and build scalable web applications."
    },
    {
      id: "JD002",
      title: "DevOps Engineer",
      company: "CloudFirst Inc",
      location: "Remote",
      experience: "3-5 years",
      status: "active",
      candidates: 5,
      deadline: "Dec 20, 2024",
      skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
      description: "Seeking a DevOps engineer to help manage our cloud infrastructure and deployment pipelines."
    },
    {
      id: "JD003",
      title: "Product Manager",
      company: "Innovation Labs",
      location: "Mumbai",
      experience: "6-10 years",
      status: "pending",
      candidates: 12,
      deadline: "Dec 10, 2024",
      skills: ["Product Strategy", "Analytics", "Agile", "Leadership"],
      description: "Product manager needed to drive product strategy and work with cross-functional teams."
    },
    {
      id: "JD004",
      title: "UI/UX Designer",
      company: "Design Studio",
      location: "Delhi",
      experience: "3-5 years",
      status: "active",
      candidates: 6,
      deadline: "Dec 18, 2024",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
      description: "Creative UI/UX designer to create beautiful and intuitive user experiences."
    }
  ];

  const handleNewJob = () => {
    navigate("/create-job");
  };

  const handleTitleClick = (job: any) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const handleSubmitCandidate = (jobId: string) => {
    navigate(`/submit-candidate?jobId=${jobId}`);
    setIsDetailsOpen(false);
  };

  const handleFilter = () => {
    toast({
      title: "Filter",
      description: "Filter options would open here",
    });
  };

  const filteredJobs = jobDescriptions.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search job descriptions..." 
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
          <Button size="sm" onClick={handleNewJob}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="bg-gradient-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle 
                    className="text-xl font-bold cursor-pointer hover:text-primary transition-colors bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent hover:from-accent hover:to-primary"
                    onClick={() => handleTitleClick(job)}
                  >
                    {job.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                </div>
                <Badge variant={job.status === "active" ? "default" : "secondary"}>
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{job.deadline}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{job.candidates} candidates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{job.experience}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{job.skills.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Company</h4>
                  <p className="text-muted-foreground">{selectedJob.company}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-muted-foreground">{selectedJob.location}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Experience Required</h4>
                  <p className="text-muted-foreground">{selectedJob.experience}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Deadline</h4>
                  <p className="text-muted-foreground">{selectedJob.deadline}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge variant={selectedJob.status === "active" ? "default" : "secondary"}>
                  {selectedJob.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Candidates Submitted</h4>
                <p className="text-muted-foreground">{selectedJob.candidates} candidates</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedJob.description}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={() => handleSubmitCandidate(selectedJob.id)} className="flex-1">
                  Submit Candidate
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
