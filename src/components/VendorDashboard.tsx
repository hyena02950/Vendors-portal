
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorOnboarding } from "@/components/VendorOnboarding";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useUserRole } from "@/hooks/useUserRole";

const VendorDashboard = () => {
  const { loading, isVendorUser } = useUserRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isVendorUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your vendor profile, upload documents, and track your submissions.
            </p>
          </div>

          <Tabs defaultValue="onboarding" className="space-y-4">
            <TabsList>
              <TabsTrigger value="onboarding">Document Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="onboarding">
              <VendorOnboarding />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
