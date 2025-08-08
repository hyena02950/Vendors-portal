import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { getToken } from "@/utils/auth";

interface RoleAssignment {
  id: string;
  user_id: string;
  role: AppRole;
  vendor_id: string | null;
  created_at: string;
  vendor_name?: string;
}

interface Vendor {
  id: string;
  name: string;
}

export const RoleManagement = () => {
  const { isElikaAdmin } = useUserRole();
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleAssignment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchUserProfiles = async () => {
    try {
      console.log("Fetching user profiles for role management...");
      
      const token = getToken();
      if (!token) return {};

      const response = await fetch('/api/users/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching user profiles');
        return {};
      }

      const data = await response.json();
      console.log("User profiles fetched for role management:", data);
      const profileMap: {[key: string]: string} = {};
      data.profiles?.forEach((profile: any) => {
        profileMap[profile.id] = profile.contact_person || profile.email || 'Unknown';
      });
      
      setUserProfiles(profileMap);
      return profileMap;
    } catch (error) {
      console.error('Unexpected error fetching user profiles:', error);
      return {};
    }
  };

  const getUserIdFromEmail = async (email: string): Promise<string> => {
    console.log('Looking up user ID for email:', email);
    
    const token = getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`/api/users/lookup?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Found user via lookup:', data.userId);
      return data.userId;
    }

    throw new Error(`User with email ${email} not found. Please make sure the user has signed up first.`);
  };

  const fetchRoles = async () => {
    try {
      console.log("Fetching all user roles for role management...");
      
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/users/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching roles');
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log("Roles fetched successfully:", data);
      
      if (!data.roles || data.roles.length === 0) {
        setRoles([]);
        return;
      }

      setRoles(data.roles as RoleAssignment[]);
    } catch (error) {
      console.error('Unexpected error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  const fetchVendors = async () => {
    try {
      console.log("Fetching vendors for role management...");
      
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching vendors');
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      console.log("Vendors fetched successfully:", data);
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Unexpected error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isElikaAdmin) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchRoles(), fetchVendors(), fetchUserProfiles()]);
        setLoading(false);
      };
      loadData();

      // Set up real-time subscription for vendor changes
      const vendorChannel = supabase
        .channel('vendor-changes-role-management')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'vendors'
          }, 
          (payload) => {
            console.log('Vendor change detected in role management:', payload);
            fetchVendors();
          }
        )
        .subscribe();

      // Set up real-time subscription for role changes
      const roleChannel = supabase
        .channel('role-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_roles'
          },
          (payload) => {
            console.log('Role change detected:', payload);
            fetchRoles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(vendorChannel);
        supabase.removeChannel(roleChannel);
      };
    } else {
      setLoading(false);
    }
  }, [isElikaAdmin]);

  const handleAddRole = async () => {
    if (!newUserEmail || !selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRole.startsWith('vendor') && !selectedVendor) {
      toast({
        title: "Vendor Required",
        description: "Please select a vendor for vendor roles.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingRole(true);

    try {
      // Get user ID from email
      const userId = await getUserIdFromEmail(newUserEmail);

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
          role: selectedRole,
          vendorId: selectedRole.startsWith('vendor') ? selectedVendor : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign role');
      }

      toast({
        title: "Role Assigned",
        description: `Role has been assigned to ${newUserEmail} successfully.`,
      });

      setNewUserEmail("");
      setSelectedRole("");
      setSelectedVendor("");
      setDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleRemoveRole = async (roleId: string, userId: string, role: string) => {
    const userEmail = userProfiles[userId] || userId;
    if (!confirm(`Are you sure you want to remove the ${role} role for ${userEmail}?`)) {
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/users/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove role');
      }

      toast({
        title: "Role Removed",
        description: "Role has been removed successfully.",
      });

      fetchRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: AppRole) => {
    const labels: Record<AppRole, string> = {
      vendor_admin: 'Vendor Admin',
      vendor_recruiter: 'Vendor Recruiter',
      elika_admin: 'Elika Admin',
      delivery_head: 'Delivery Head',
      finance_team: 'Finance Team',
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'elika_admin':
      case 'delivery_head':
        return 'default';
      case 'finance_team':
        return 'secondary';
      case 'vendor_admin':
        return 'outline';
      case 'vendor_recruiter':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!isElikaAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            You need Elika admin permissions to access role management.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Role Management</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchRoles(); fetchVendors(); fetchUserProfiles(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">User Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The user must have already signed up to the platform.
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elika_admin">Elika Admin</SelectItem>
                      <SelectItem value="delivery_head">Delivery Head</SelectItem>
                      <SelectItem value="finance_team">Finance Team</SelectItem>
                      <SelectItem value="vendor_admin">Vendor Admin</SelectItem>
                      <SelectItem value="vendor_recruiter">Vendor Recruiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole?.startsWith('vendor') && (
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleAddRole} disabled={isAddingRole} className="w-full">
                  {isAddingRole ? "Assigning Role..." : "Assign Role"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.length > 0 ? (
            roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="font-medium">
                      {userProfiles[role.user_id] || role.user_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {role.vendor_name && `${role.vendor_name} • `}
                      Added: {new Date(role.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(role.role)}>
                    {getRoleLabel(role.role)}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRole(role.id, role.user_id, getRoleLabel(role.role))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">No roles assigned yet</p>
                  <p className="text-sm text-muted-foreground">Assign your first role by clicking the "Assign Role" button above.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
