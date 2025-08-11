import { useState, useEffect, createContext, useContext } from "react";
import { 
  setTokens, 
  setUser, 
  removeTokens, 
  removeUser, 
  getAccessToken, 
  getRefreshToken,
  getUser,
  refreshAccessToken,
  signOut as authSignOut
} from "@/utils/auth";

interface User {
  id: string;
  email: string;
  roles: string[];
  vendorId?: string;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const accessToken = getAccessToken();
    const userData = getUser();
    
    if (accessToken && userData) {
      setUserState(userData);
    } else {
      // Try to refresh token if we have a refresh token
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        refreshAccessToken().then(success => {
          if (success) {
            const updatedUser = getUser();
            setUserState(updatedUser);
          }
        });
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, companyName?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          companyName,
          contactPerson: email.split('@')[0]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.message || 'Registration failed' } };
      }

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setUserState(data.user);

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires2FA) {
          return { error: { message: '2FA required', requires2FA: true, tempUserId: data.tempUserId } };
        }
        return { error: { message: data.message || 'Login failed' } };
      }

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setUserState(data.user);

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signOut = async () => {
    try {
      await authSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};