
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentReview } from "@/components/DocumentReview";
import UserManagement from "@/components/UserManagement";
import { RolePermissionMatrix } from "@/components/RolePermissionMatrix";
import { VendorManagement } from "@/components/VendorManagement";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useUserRole } from "@/hooks/useUserRole";

const AdminDashboard = () => {
  const { loading, isElikaAdmin, isDeliveryHead, isElikaUser } = useUserRole();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Only allow Elika users (admin, delivery head, finance team) to access admin dashboard
  if (!isElikaUser) {
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, vendors, review documents, and oversee operations.
            </p>
          </div>

          <Tabs defaultValue="vendors" className="space-y-4">
            <TabsList>
              <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
              {(isElikaAdmin || isDeliveryHead) && (
                <TabsTrigger value="documents">Document Review</TabsTrigger>
              )}
              {isElikaAdmin && (
                <>
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="vendors">
              <VendorManagement />
            </TabsContent>

            {(isElikaAdmin || isDeliveryHead) && (
              <TabsContent value="documents">
                <DocumentReview />
              </TabsContent>
            )}

            {isElikaAdmin && (
              <>
                <TabsContent value="users">
                  <UserManagement />
                </TabsContent>
                <TabsContent value="permissions">
                  <RolePermissionMatrix />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
