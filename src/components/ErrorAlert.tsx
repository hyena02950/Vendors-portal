
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  actionLabel?: string;
  variant?: 'destructive' | 'warning';
}

export const ErrorAlert = ({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  onDismiss, 
  actionLabel = "Try Again",
  variant = 'destructive'
}: ErrorAlertProps) => {
  const isWarning = variant === 'warning';
  
  return (
    <Alert className={`${isWarning ? 'border-warning/50 text-warning-foreground bg-warning-light' : 'border-destructive/50'} relative`}>
      <AlertTriangle className={`h-4 w-4 ${isWarning ? 'text-warning' : ''}`} />
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <AlertDescription className="mt-2 pr-8">
        <div className="space-y-3">
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm opacity-90 mt-1">{message}</p>
          </div>
          {onRetry && (
            <Button 
              variant={isWarning ? "outline" : "destructive"}
              size="sm" 
              onClick={onRetry}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              {actionLabel}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
