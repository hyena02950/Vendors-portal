
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export interface UserProfile {
  id: string;
  company_name: string | null;
  contact_person: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  user_roles?: Array<{
    role: string;
  }>;
}

export const useUserProfiles = () => {
  const { isElikaAdmin } = useUserRole();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!isElikaAdmin) {
      console.log('Not an Elika admin, skipping profile fetch');
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching user profiles...");
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log('User profiles fetched:', data);
      
      // Transform the data to match the expected structure
      const normalizedProfiles = (data || []).map(profile => ({
        ...profile,
        full_name: profile.contact_person || profile.email || 'Unknown',
        user_roles: profile.user_roles || []
      })) as UserProfile[];
      
      setProfiles(normalizedProfiles);
    } catch (err) {
      console.error('Unexpected error fetching profiles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    if (isElikaAdmin) {
      // Set up real-time subscription for profile changes
      const profileChannel = supabase
        .channel('profiles-updates')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('Profile change detected:', payload);
            fetchProfiles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileChannel);
      };
    }
  }, [isElikaAdmin]);

  const refetch = () => {
    setLoading(true);
    fetchProfiles();
  };

  return {
    profiles,
    loading,
    error,
    refetch
  };
};
