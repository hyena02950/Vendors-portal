
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Trash2, Users, UserCog } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ErrorAlert } from "@/components/ErrorAlert";
import { UserProfileSkeleton } from "@/components/LoadingSkeletons";
import { getToken } from "@/utils/auth";

type AppRole = "vendor_admin" | "vendor_recruiter" | "elika_admin" | "delivery_head" | "finance_team";

const UserManagement = () => {
  const { profiles, loading, error, refetch } = useUserProfiles();
  const { isElikaAdmin } = useUserRole();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUser) {
      // Fetch the current role of the selected user
      const fetchUserRole = async () => {
        try {
          const token = getToken();
          if (!token) return;

          const response = await fetch(`/api/users/${selectedUser}/roles`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error("Error fetching user role");
            return;
          }

          const data = await response.json();
          if (data.roles && data.roles.length > 0) {
            setSelectedRole(data.roles[0].role as AppRole);
          } else {
            setSelectedRole(""); // No role assigned
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      };

      fetchUserRole();
    }
  }, [selectedUser]);

  const handleRoleAssignment = async (userId: string, roleName: string) => {
    setIsAssigning(true);
    try {
      // Map role names to the actual enum values
      const roleMapping: { [key: string]: AppRole } = {
        'elika-admin': 'elika_admin',
        'elika-delivery-head': 'delivery_head',
        'elika-finance-team': 'finance_team',
        'vendor': 'vendor_admin'
      };

      const roleValue = roleMapping[roleName] as AppRole;

      if (!roleValue) {
        toast({
          title: "Error",
          description: "Invalid role selected",
          variant: "destructive",
        });
        return;
      }

      const token = getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/users/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: roleValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to assign role",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Role assigned successfully!",
      });
      refetch(); // Refresh user profiles
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: `Failed to assign role: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    setIsAssigning(true);
    setDeleteError(null);
    try {
      const token = getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDeleteError(errorData.message || 'Failed to delete user');
        return;
      }

      toast({
        title: "Success",
        description: "User profile deleted successfully!",
      });
      refetch(); // Refresh user profiles
    } catch (error) {
      console.error("Error deleting user:", error);
      setDeleteError(`Failed to delete user: ${error}`);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isElikaAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to access user management.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">Manage user profiles and assign roles</p>
          </div>
          <Button onClick={refetch} variant="outline" disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error && (
          <ErrorAlert
            title="Failed to load users"
            message={error}
            onRetry={refetch}
            onDismiss={() => {}}
          />
        )}

        {deleteError && (
          <ErrorAlert
            title="Failed to delete user"
            message={deleteError}
            onDismiss={() => setDeleteError(null)}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <UserProfileSkeleton key={index} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">No user profiles are available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <Card key={profile.id} className="bg-gradient-card shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {profile.full_name?.charAt(0) || profile.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {profile.full_name || 'No name'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.user_roles && profile.user_roles.length > 0 ? (
                            profile.user_roles.map((userRole: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {userRole.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">No roles assigned</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <UserCog className="mr-2 h-4 w-4" />
                            Assign Role
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleRoleAssignment(profile.id, 'elika-admin')}>
                            Assign Elika Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleAssignment(profile.id, 'elika-delivery-head')}>
                            Assign Delivery Head
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleAssignment(profile.id, 'elika-finance-team')}>
                            Assign Finance Team
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleAssignment(profile.id, 'vendor')}>
                            Assign Vendor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={isAssigning}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserManagement;
