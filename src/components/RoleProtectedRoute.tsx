
import { ReactNode } from "react";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: AppRole[];
  fallback?: ReactNode;
}

export const RoleProtectedRoute = ({ 
  children, 
  requiredRoles, 
  fallback 
}: RoleProtectedRouteProps) => {
  const { loading, hasRole } = useUserRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const hasRequiredRole = requiredRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
