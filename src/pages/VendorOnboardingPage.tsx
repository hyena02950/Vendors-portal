
import { VendorOnboarding } from "@/components/VendorOnboarding";
import { useUserRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Building } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const VendorOnboardingPage = () => {
  const { loading, isVendorUser, roles, isElikaAdmin } = useUserRole();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Vendor Onboarding</h1>
                <p className="text-muted-foreground mt-2">
                  Upload the required documents to complete your vendor registration.
                </p>
              </div>

              <VendorOnboarding />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboardingPage;
