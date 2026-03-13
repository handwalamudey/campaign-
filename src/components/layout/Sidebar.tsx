import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import {
  LayoutDashboard,
  Database,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Compass,
  TrendingUp,
  LogOut,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, UserRole } from '@/store/authStore';

const navItems: { to: string; icon: any; label: string; allowedRoles?: UserRole[] }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/voters', icon: Users, label: 'Voters' },
  { to: '/mobilizers', icon: TrendingUp, label: 'Mobilizers' },
  { to: '/data', icon: Database, label: 'Data Management', allowedRoles: ['admin', 'aspirant'] },
  { to: '/reports', icon: FileText, label: 'Field Reports' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', allowedRoles: ['admin', 'aspirant'] },
];

interface SidebarProps {
  className?: string;
  onNavItemClick?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ className, onNavItemClick, isMobile }: SidebarProps) {
  const { isSidebarCollapsed: collapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleNavItemClick = () => {
    if (onNavItemClick) {
      onNavItemClick();
    }
  };

  const handleLogout = () => {
    logout();
  };

  const filteredNavItems = navItems.filter(
    item => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  return (
    <aside
      className={cn(
        "left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300",
        !className?.includes('static') && "fixed",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-semibold text-foreground">Campaign Compass</h1>
              <p className="text-xs text-muted-foreground">Garissa Township</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-border p-3 space-y-1">
          <NavLink
            to="/settings"
            onClick={handleNavItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              location.pathname === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Compass className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">Settings</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>

          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
