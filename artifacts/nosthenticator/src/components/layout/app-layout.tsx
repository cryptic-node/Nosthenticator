import { Link, useLocation } from "wouter";
import { Activity, Key, ListOrdered, ShieldAlert, Settings, Hexagon, Terminal, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const routes = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/keys", label: "Identities", icon: Key },
    { href: "/pending", label: "Pending", icon: ShieldAlert },
    { href: "/log", label: "Audit Log", icon: ListOrdered },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-border bg-sidebar h-full flex flex-col font-mono text-sm">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Hexagon className="w-5 h-5 mr-2 text-primary" />
        <span className="font-bold tracking-tight">NOSTHENTICATOR</span>
      </div>
      
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {routes.map((route) => (
          <Link key={route.href} href={route.href}>
            <div
              data-testid={`nav-link-${route.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm cursor-pointer transition-colors",
                location === route.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <route.icon className="w-4 h-4" />
              {route.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <ThemeToggle />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-sidebar-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 mr-2" />
      ) : (
        <Moon className="w-4 h-4 mr-2" />
      )}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
