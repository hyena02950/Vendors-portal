
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
  const { isElikaAdmin, isDeliveryHead, isVendorAdmin, isVendorUser, isElikaUser, loading, vendorId } = useUserRole();
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

  // Different navigation for different user types
  const getNavigationItems = () => {
    if (isElikaUser) {
      return [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          current: location.pathname === "/dashboard"
        },
        {
          name: "Job Descriptions",
          href: "/dashboard",
          icon: FileText,
          current: false
        },
        {
          name: "Candidates",
          href: "/dashboard",
          icon: Users,
          current: false
        },
        {
          name: "Interviews",
          href: "/dashboard",
          icon: Calendar,
          current: false
        },
        {
          name: "Invoices",
          href: "/dashboard",
          icon: Receipt,
          current: false
        },
        {
          name: "Analytics",
          href: "/dashboard",
          icon: BarChart3,
          current: false
        },
        {
          name: "Profile Settings",
          href: "/dashboard",
          icon: Settings,
          current: false
        }
      ];
    } else {
      // Vendor users - limited navigation with vendor onboarding
      const items = [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          current: location.pathname === "/dashboard"
        }
      ];

      // Show vendor onboarding for vendor users
      if (isVendorUser) {
        items.push({
          name: "Vendor Onboarding",
          href: "/vendor-onboarding",
          icon: Building,
          current: location.pathname === "/vendor-onboarding"
        });
      }

      items.push(
        {
          name: "Job Descriptions",
          href: "/dashboard",
          icon: FileText,
          current: false
        },
        {
          name: "Candidates",
          href: "/dashboard",
          icon: Users,
          current: false
        },
        {
          name: "Interviews",
          href: "/dashboard",
          icon: Calendar,
          current: false
        },
        {
          name: "Invoices",
          href: "/dashboard",
          icon: Receipt,
          current: false
        },
        {
          name: "Profile Settings",
          href: "/dashboard",
          icon: Settings,
          current: false
        }
      );

      return items;
    }
  };

  const navigationItems = getNavigationItems();

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
      show: isElikaUser
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
              <div className="text-sm font-medium text-foreground truncate">
                {isElikaUser ? 'Elika User' : 'Vendor User'}
              </div>
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
