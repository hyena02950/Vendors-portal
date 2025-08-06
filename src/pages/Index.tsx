import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading, roles } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (roles.length > 0) {
        navigate("/dashboard");
      }
      // If no roles, stay on this page to show pending access message
    }
  }, [user, authLoading, roleLoading, roles, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access pending message for users without roles
  if (roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Pending</h1>
            <p className="text-muted-foreground mb-6">
              Your account has been created successfully. Please wait for an administrator to assign you the appropriate role and permissions.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your system administrator if you believe this is an error.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return null;
}
