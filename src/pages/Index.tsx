
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import AdminDashboard from "@/pages/AdminDashboard";

export default function Index() {
  const { user, loading } = useAuth();
  const { isVendorUser, isElikaUser, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  if (isVendorUser) {
    return <VendorDashboardPage />;
  }

  if (isElikaUser) {
    return <AdminDashboard />;
  }

  // Fallback
  return <Navigate to="/login" replace />;
}
