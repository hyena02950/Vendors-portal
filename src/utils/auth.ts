
import { supabase } from "@/integrations/supabase/client";

// Simple auth utilities for localStorage management
export const getToken = (): string | null => {
  return localStorage.getItem("sb-access-token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("sb-access-token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("sb-access-token");
  localStorage.removeItem("sb-refresh-token");
};

export const getUser = (): any => {
  const user = localStorage.getItem("sb-user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem("sb-user", JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem("sb-user");
};

// Check if user is authenticated using Supabase session
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Sign out using Supabase
export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
  removeToken();
  removeUser();
};
