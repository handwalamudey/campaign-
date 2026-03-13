import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Compass } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar aria-label="Sidebar navigation" />
      </div>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild aria-label="Open mobile menu">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none bg-transparent">
            <Sidebar
              className="static border-none shadow-none"
              onNavItemClick={() => setIsMobileMenuOpen(false)}
              isMobile
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="truncate text-sm font-semibold text-foreground">Campaign Compass</span>
        </div>
      </header>

      <main 
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
