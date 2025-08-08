
import { useState, useEffect } from "react";
import { useUserRole } from "./useUserRole";
import { getToken } from "@/utils/auth";

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
      
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/users/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch profiles');
        return;
      }

      const data = await response.json();
      console.log('User profiles fetched:', data);
      
      // Transform the data to match the expected structure
      const normalizedProfiles = (data.profiles || []).map(profile => ({
        ...profile,
        full_name: profile.contact_person || profile.email || 'Unknown',
        user_roles: profile.roles || []
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
      const interval = setInterval(fetchProfiles, 30000); // Poll every 30 seconds

      return () => {
        clearInterval(interval);
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
