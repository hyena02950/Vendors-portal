
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CreateJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    salaryRange: "",
    description: "",
    requirements: "",
    experienceRequired: "",
    skills: [] as string[],
    newSkill: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddSkill = () => {
    if (formData.newSkill && !formData.skills.includes(formData.newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill],
        newSkill: "",
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a job",
          variant: "destructive",
        });
        return;
      }

      // Generate a job_id
      const jobId = `JOB-${Date.now()}`;

      // Insert job data using correct column names
      const { data, error } = await supabase
        .from('job_descriptions')
        .insert([
          {
            job_id: jobId,
            title: formData.title,
            department: formData.department,
            location: formData.location,
            salary_range: formData.salaryRange,
            skills_required: formData.skills,
            description: formData.description,
            requirements: formData.requirements,
            experience_required: formData.experienceRequired,
            status: 'active',
            assigned_vendors: [user.id]
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job description created successfully",
      });

      // Reset form and navigate back
      setFormData({
        title: "",
        department: "",
        location: "",
        salaryRange: "",
        description: "",
        requirements: "",
        experienceRequired: "",
        skills: [],
        newSkill: "",
      });
      navigate("/dashboard?tab=jobs");
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard?tab=jobs");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="Senior React Developer"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Bangalore / Remote"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  placeholder="₹15-20 LPA"
                  value={formData.salaryRange}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryRange: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceRequired">Experience Required</Label>
              <Input
                id="experienceRequired"
                placeholder="3-5 years"
                value={formData.experienceRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceRequired: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed job description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Key requirements and qualifications..."
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a skill (e.g., React)"
                  value={formData.newSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSkill: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" onClick={handleAddSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Job"}
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

export default CreateJob;
