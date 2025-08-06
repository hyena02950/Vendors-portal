
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Calendar,
  Receipt,
  BarChart3,
  Settings,
  UserPlus,
  Upload,
  Shield,
  Building,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export const Sidebar = () => {
  const { signOut, user } = useAuth();
  const { isElikaAdmin, isDeliveryHead, isVendorAdmin, isVendorUser, isElikaUser, loading } = useUserRole();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast("Signed out successfully");
    } catch (error) {
      toast("Error signing out");
    }
  };

  if (loading) {
    return <div className="hidden md:flex md:w-64 md:flex-col bg-card border-r border-border animate-pulse">
      <div className="h-full bg-gray-200"></div>
    </div>;
  }

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard"
    },
    {
      name: "Job Descriptions",
      href: "/dashboard?tab=jobs",
      icon: FileText,
      current: location.pathname === "/dashboard" && location.search.includes("tab=jobs")
    },
    {
      name: "Candidates",
      href: "/dashboard?tab=candidates",
      icon: Users,
      current: location.pathname === "/dashboard" && location.search.includes("tab=candidates")
    },
    {
      name: "Interviews",
      href: "/dashboard?tab=interviews",
      icon: Calendar,
      current: location.pathname === "/dashboard" && location.search.includes("tab=interviews")
    },
    {
      name: "Invoices",
      href: "/dashboard?tab=invoices",
      icon: Receipt,
      current: location.pathname === "/dashboard" && location.search.includes("tab=invoices")
    },
    {
      name: "Analytics",
      href: "/dashboard?tab=analytics",
      icon: BarChart3,
      current: location.pathname === "/dashboard" && location.search.includes("tab=analytics")
    },
    {
      name: "Profile Settings",
      href: "/dashboard?tab=profile",
      icon: Settings,
      current: location.pathname === "/dashboard" && location.search.includes("tab=profile")
    }
  ];

  const quickActions = [
    {
      name: "Submit Candidate",
      href: "/submit-candidate",
      icon: UserPlus,
      current: location.pathname === "/submit-candidate",
      show: isVendorUser
    },
    {
      name: "Upload Invoice",
      href: "/invoice-upload",
      icon: Upload,
      current: location.pathname === "/invoice-upload",
      show: isVendorUser
    }
  ];

  const adminActions = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
      current: location.pathname === "/admin",
      show: isElikaUser // Only show to Elika users (admin, delivery head, finance team)
    },
    {
      name: "Vendor Onboarding",
      href: "/vendor-onboarding",
      icon: Building,
      current: location.pathname === "/vendor-onboarding",
      show: isVendorUser // Only show to vendor users
    }
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-card border-r border-border">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
        </div>
        <nav className="mt-8 flex-1 px-3 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive || item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon
                className="mr-3 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {quickActions.some(action => action.show) && (
          <div className="px-3 mt-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h3>
            <nav className="mt-2 space-y-1">
              {quickActions.filter(action => action.show).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {adminActions.some(action => action.show) && (
          <div className="px-3 mt-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </h3>
            <nav className="mt-2 space-y-1">
              {adminActions.filter(action => action.show).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* User Section */}
        <div className="px-3 mt-6 pt-4 border-t border-border">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">User</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mt-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
