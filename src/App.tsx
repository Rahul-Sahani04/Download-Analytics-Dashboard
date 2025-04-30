import { useEffect, useState, createContext, useContext } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/auth-context";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

export type Route = 'dashboard' | 'users' | 'settings';

export const RouteContext = createContext<{
  currentRoute: Route;
  setCurrentRoute: (route: Route) => void;
} | undefined>(undefined);

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { currentRoute } = useRoute();

  // Log auth state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const renderRoute = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? renderRoute() : <Login />}
    </div>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const saved = localStorage.getItem('currentRoute') as Route;
    return saved || 'dashboard';
  });

  // Update route when navigation happens
  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const target = (e as CustomEvent).detail as Route;
      setCurrentRoute(target);
      localStorage.setItem('currentRoute', target);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => window.removeEventListener('navigate', handleNavigation as EventListener);
  }, []);

  // Save route changes to localStorage
  useEffect(() => {
    localStorage.setItem('currentRoute', currentRoute);
  }, [currentRoute]);

  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <RouteContext.Provider value={{ currentRoute, setCurrentRoute }}>
          <AppContent />
          <Toaster />
        </RouteContext.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
