// Simple auth utilities for localStorage management
export const getAccessToken = (): string | null => {
  return localStorage.getItem("access-token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh-token");
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("access-token", accessToken);
  localStorage.setItem("refresh-token", refreshToken);
};

export const removeTokens = (): void => {
  localStorage.removeItem("access-token");
  localStorage.removeItem("refresh-token");
  localStorage.removeItem("auth-user");
};

// Legacy function for backward compatibility
export const getToken = (): string | null => {
  return getAccessToken();
};

export const setToken = (token: string): void => {
  localStorage.setItem("access-token", token);
};

export const removeToken = (): void => {
  removeTokens();
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
  const token = getAccessToken();
  const user = getUser();
  return !!(token && user);
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      removeTokens();
      return false;
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    removeTokens();
    return false;
  }
};

// Sign out
export const signOut = async (logoutAllDevices: boolean = false): Promise<void> => {
  const refreshToken = getRefreshToken();
  
  try {
    const accessToken = getAccessToken();
    if (accessToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken, logoutAllDevices }),
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  removeTokens();
  removeUser();
};