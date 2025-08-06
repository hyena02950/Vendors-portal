
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 'vendor_admin' | 'vendor_recruiter' | 'elika_admin' | 'delivery_head' | 'finance_team';

interface UserRoleData {
  id: string;
  role: AppRole;
  vendor_id: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('No user found, resetting roles');
      setRoles([]);
      setVendorId(null);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        console.log('Fetching user roles for user:', user.id);
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('id, role, vendor_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
          setVendorId(null);
        } else {
          console.log('User roles fetched:', data);
          setRoles(data || []);
          // Get vendor_id from the first role that has one
          const userVendorId = data?.find(role => role.vendor_id)?.vendor_id || null;
          console.log('Setting vendor_id:', userVendorId);
          setVendorId(userVendorId);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
        setVendorId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();

    // Set up real-time subscription for role changes
    const channel = supabase.channel('user-roles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Role change detected:', payload);
          fetchUserRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasRole = (role: AppRole) => {
    return roles.some(r => r.role === role);
  };

  // Return boolean values directly, not functions
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
