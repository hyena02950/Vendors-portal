import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-success/20 bg-success-light/50",
    warning: "border-warning/20 bg-warning-light/50",
    destructive: "border-destructive/20 bg-red-50/50"
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive"
  };

  return (
    <Card className={cn(
      "bg-gradient-card shadow-md hover:shadow-lg transition-shadow duration-200",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg bg-background",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};