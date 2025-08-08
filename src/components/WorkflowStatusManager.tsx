
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  User,
  Building
} from "lucide-react";
import { getToken } from "@/utils/auth";

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  description: string;
  estimatedDays: number;
  actualDays?: number;
  blockedReason?: string;
}

interface VendorWorkflow {
  vendorId: string;
  vendorName: string;
  currentStep: number;
  steps: WorkflowStep[];
  overallProgress: number;
  isBlocked: boolean;
  totalDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
}

export const WorkflowStatusManager = () => {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<VendorWorkflow[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultWorkflowSteps: WorkflowStep[] = [
    {
      id: 'registration',
      name: 'Vendor Registration',
      status: 'completed',
      description: 'Initial vendor registration and profile setup',
      estimatedDays: 1
    },
    {
      id: 'document_submission',
      name: 'Document Submission',
      status: 'in_progress',
      description: 'Upload required documents (NDA, MSA, certificates)',
      estimatedDays: 3
    },
    {
      id: 'document_review',
      name: 'Document Review',
      status: 'pending',
      description: 'Admin review and approval of submitted documents',
      estimatedDays: 2
    },
    {
      id: 'application_review',
      name: 'Application Review',
      status: 'pending',
      description: 'Final application review and vendor approval',
      estimatedDays: 1
    },
    {
      id: 'onboarding_complete',
      name: 'Onboarding Complete',
      status: 'pending',
      description: 'Vendor is active and ready for job assignments',
      estimatedDays: 1
    }
  ];

  const fetchWorkflowData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors/workflow-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow data');
      }

      const { vendors } = await response.json();

      const workflowData: VendorWorkflow[] = vendors?.map(vendor => {
        const docs = vendor.documents || [];
        const application = vendor.application;
        
        const totalDocs = docs.length;
        const approvedDocs = docs.filter(d => d.status === 'approved').length;
        const rejectedDocs = docs.filter(d => d.status === 'rejected').length;
        const pendingDocs = docs.filter(d => d.status === 'pending').length;

        // Determine current workflow step and status
        let currentStep = 0;
        let isBlocked = false;
        const steps = [...defaultWorkflowSteps];

        // Update step statuses based on actual data
        if (vendor.status === 'pending') {
          steps[0].status = 'completed'; // Registration done
          
          if (totalDocs > 0) {
            steps[1].status = pendingDocs > 0 ? 'in_progress' : 'completed';
            currentStep = 1;
            
            if (totalDocs > 0 && pendingDocs === 0) {
              steps[2].status = approvedDocs === totalDocs ? 'completed' : 'in_progress';
              currentStep = 2;
              
              if (rejectedDocs > 0) {
                isBlocked = true;
                steps[2].status = 'blocked';
                steps[2].blockedReason = `${rejectedDocs} documents rejected`;
              }
            }
          }
        }

        if (application?.status === 'submitted') {
          steps[3].status = 'in_progress';
          currentStep = Math.max(currentStep, 3);
        }

        if (application?.status === 'approved' || vendor.status === 'active') {
          steps[3].status = 'completed';
          steps[4].status = 'completed';
          currentStep = 4;
        }

        if (application?.status === 'rejected') {
          isBlocked = true;
          steps[3].status = 'blocked';
          steps[3].blockedReason = 'Application rejected';
        }

        const completedSteps = steps.filter(s => s.status === 'completed').length;
        const overallProgress = (completedSteps / steps.length) * 100;

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          currentStep,
          steps,
          overallProgress,
          isBlocked,
          totalDocuments: totalDocs,
          approvedDocuments: approvedDocs,
          rejectedDocuments: rejectedDocs,
        };
      }) || [];

      setWorkflows(workflowData);
    } catch (error: any) {
      console.error('Error fetching workflow data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflow data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchWorkflowData();
    
    // Set up real-time updates
    const interval = setInterval(fetchWorkflowData, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workflow data...</p>
        </CardContent>
      </Card>
    );
  }

  const blockedWorkflows = workflows.filter(w => w.isBlocked);
  const activeWorkflows = workflows.filter(w => !w.isBlocked && w.overallProgress < 100);
  const completedWorkflows = workflows.filter(w => w.overallProgress === 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Blocked Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedWorkflows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedWorkflows.length}</div>
          </CardContent>
        </Card>
      </div>

      {blockedWorkflows.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Blocked Workflows - Immediate Attention Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blockedWorkflows.map((workflow) => (
                <div key={workflow.vendorId} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-red-600" />
                      <span className="font-medium">{workflow.vendorName}</span>
                      <Badge variant="destructive">BLOCKED</Badge>
                    </div>
                    <Progress value={workflow.overallProgress} className="w-32" />
                  </div>
                  
                  <div className="text-sm text-red-700">
                    Blocked at: {workflow.steps[workflow.currentStep]?.name}
                    {workflow.steps[workflow.currentStep]?.blockedReason && (
                      <span className="ml-2">- {workflow.steps[workflow.currentStep].blockedReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Vendor Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activeWorkflows.map((workflow) => (
              <div key={workflow.vendorId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{workflow.vendorName}</span>
                    <Badge variant="outline">
                      {workflow.approvedDocuments}/{workflow.totalDocuments} docs approved
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {Math.round(workflow.overallProgress)}% Complete
                    </span>
                    <Progress value={workflow.overallProgress} className="w-32" />
                  </div>
                </div>

                <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-2 flex-shrink-0">
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          step.status === 'completed' ? 'border-green-500 bg-green-50' :
                          step.status === 'in_progress' ? 'border-blue-500 bg-blue-50' :
                          step.status === 'blocked' ? 'border-red-500 bg-red-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          {getStepIcon(step.status)}
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium">{step.name}</div>
                          <Badge className={`text-xs ${getStepBadgeColor(step.status)}`}>
                            {step.status}
                          </Badge>
                        </div>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
