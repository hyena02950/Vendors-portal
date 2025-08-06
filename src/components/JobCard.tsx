
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { Clock, Users, DollarSign, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  budget: string;
  candidates: number;
  deadline: string;
  status: "active" | "pending" | "completed";
  skills: string[];
}

export const JobCard = ({
  id,
  title,
  company,
  location,
  budget,
  candidates,
  deadline,
  status,
  skills
}: JobCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewDetails = () => {
    setIsDetailsOpen(true);
    toast({
      title: "Job Details",
      description: `Viewing details for ${title}`,
    });
  };

  const handleSubmitCandidate = () => {
    navigate(`/submit-candidate?jobId=${id}`);
  };

  return (
    <>
      <Card className="bg-gradient-card shadow-md hover:shadow-lg transition-all duration-200 border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{company}</p>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{budget}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{candidates} candidates</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{deadline}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Required Skills:</p>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button variant="default" size="sm" className="flex-1" onClick={handleViewDetails}>
              View Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleSubmitCandidate}>
              Submit Candidate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Company</h4>
                <p className="text-muted-foreground">{company}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Location</h4>
                <p className="text-muted-foreground">{location}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Budget</h4>
                <p className="text-muted-foreground">{budget}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Deadline</h4>
                <p className="text-muted-foreground">{deadline}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Status</h4>
              <StatusBadge status={status} />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Candidates Submitted</h4>
              <p className="text-muted-foreground">{candidates} candidates</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSubmitCandidate} className="flex-1">
                Submit Candidate
              </Button>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
