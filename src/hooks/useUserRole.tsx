
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export type AppRole = 'vendor_admin' | 'vendor_recruiter' | 'elika_admin' | 'delivery_head' | 'finance_team';

interface UserRoleData {
  role: AppRole;
  vendorId?: string;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setVendorId(null);
      setLoading(false);
      return;
    }

    // Extract roles from user data
    const normalizedRoles = (user.roles as any[] | undefined)?.map((r: any) => {
      if (typeof r === 'string') {
        return { role: r as AppRole };
      } else if (r && typeof r === 'object') {
        return {
          role: r.role as AppRole,
          vendorId: r.vendorId
        };
      }
      return null;
    }).filter(Boolean) as UserRoleData[] || [];

    setRoles(normalizedRoles);

    // Set vendorId from the first vendor role found
    const vendorRole = normalizedRoles.find(r => 
      ['vendor_admin', 'vendor_recruiter'].includes(r.role)
    );
    setVendorId(vendorRole?.vendorId || null);
    
    setLoading(false);
  }, [user]);

  const hasRole = (role: AppRole) => {
    return roles.some(r => r.role === role);
  };

  const isVendorAdmin = hasRole('vendor_admin');
  const isVendorRecruiter = hasRole('vendor_recruiter');
  const isElikaAdmin = hasRole('elika_admin');
  const isDeliveryHead = hasRole('delivery_head');
  const isFinanceTeam = hasRole('finance_team');

  const isVendorUser = isVendorAdmin || isVendorRecruiter;
  const isElikaUser = isElikaAdmin || isDeliveryHead || isFinanceTeam;

  return {
    roles,
    vendorId,
    loading,
    hasRole,
    isVendorAdmin,
    isVendorRecruiter,
    isElikaAdmin,
    isDeliveryHead,
    isFinanceTeam,
    isVendorUser,
    isElikaUser,
  };
};
