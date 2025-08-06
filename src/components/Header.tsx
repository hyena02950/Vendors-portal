
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "./NotificationDropdown";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { roles, loading } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileSettings = () => {
    navigate("/dashboard?tab=profile");
  };

  const getRoleDisplayName = (roleType: string) => {
    const roleNames: Record<string, string> = {
      'vendor_admin': 'Vendor Admin',
      'vendor_recruiter': 'Vendor Recruiter',
      'elika_admin': 'Elika Admin',
      'delivery_head': 'Delivery Head',
      'finance_team': 'Finance Team'
    };
    return roleNames[roleType] || roleType;
  };

  const primaryRole = roles[0]?.role || 'No Role Assigned';

  return (
    <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-xl">
            ELIKA
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Vendor Portal</h1>
            <p className="text-sm text-muted-foreground">Recruitment Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : getRoleDisplayName(primaryRole)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileSettings}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
