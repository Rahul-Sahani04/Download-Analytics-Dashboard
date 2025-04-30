import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService } from '@/services/auth-service';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty';
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user data from local storage on mount
  useEffect(() => {
    const { user: savedUser } = authService.getUserData();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    authService.saveUserData(response);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      authService.clearUserData();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}