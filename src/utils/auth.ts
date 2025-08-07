// Simple auth utilities for localStorage management
export const getToken = (): string | null => {
  return localStorage.getItem("auth-token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("auth-token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("auth-token");
  localStorage.removeItem("auth-user");
};

export const getUser = (): any => {
  const user = localStorage.getItem("auth-user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem("auth-user", JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem("auth-user");
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// Sign out
export const signOut = (): void => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};