import { useState, useCallback } from 'react';
import { Menu, X, Download, Home, Users, LogOut, Sun, Moon, Settings, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';
import { Route, useRoute } from '@/App';

// type Route = 'dashboard' | 'users' | 'settings';

interface NavItem {
  name: string;
  route: Route;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const navigation: NavItem[] = [
    { name: 'Dashboard', route: 'dashboard', icon: Home },
    { name: 'Resources', route: 'resources', icon: FolderOpen },
    { name: 'Users', route: 'users', icon: Users },
    { name: 'Settings', route: 'settings', icon: Settings },
  ];

  const { currentRoute, setCurrentRoute } = useRoute();
  
  const handleNavigation = useCallback((route: Route) => {
    setCurrentRoute(route);
  }, [setCurrentRoute]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r">
        <div className="flex flex-col flex-grow pt-5 bg-background overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Analytics Hub</span>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.route)}
                  className={`group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md 
                    ${currentRoute === item.route
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      currentRoute === item.route
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-accent-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center">
              <div>
                <div className="rounded-full h-9 w-9 flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <ScrollArea className="h-full py-6">
            <div className="flex items-center justify-between px-6 mb-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
                  <Download className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Analytics Hub</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileNavOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="px-6 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    handleNavigation(item.route);
                    setIsMobileNavOpen(false);
                  }}
                  className={`group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md 
                    ${currentRoute === item.route
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      currentRoute === item.route
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-accent-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="mt-10 px-6">
              <div className="flex items-center border-t pt-4">
                <div>
                  <div className="rounded-full h-9 w-9 flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 md:ml-64">
        {/* Top navbar */}
        <div className="flex-shrink-0 h-16 bg-background flex border-b">
          <button
            type="button"
            className="md:hidden px-4 text-muted-foreground focus:outline-none"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 md:hidden">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}