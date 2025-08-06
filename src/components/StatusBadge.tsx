import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "in-progress" 
  | "completed"
  | "draft"
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning hover:bg-warning/20"
  },
  approved: {
    label: "Approved", 
    className: "bg-success/10 text-success hover:bg-success/20"
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20"
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/10 text-primary hover:bg-primary/20"
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success hover:bg-success/20"
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground hover:bg-muted/80"
  },
  active: {
    label: "Active",
    className: "bg-accent/10 text-accent hover:bg-accent/20"
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground hover:bg-muted/80"
  }
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};