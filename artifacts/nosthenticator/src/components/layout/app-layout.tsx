import { Link, useLocation } from "wouter";
import { KeyRound, Shield, Archive, Activity, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: KeyRound, label: "Codes" },
  { href: "/nostr", icon: Shield, label: "Nostr" },
  { href: "/vault", icon: Archive, label: "Vault" },
  { href: "/activity", icon: Activity, label: "Activity" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Nosthenticator
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-testid={`nav-${item.label.toLowerCase()}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/add" data-testid="nav-add">
            <div className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
              <Plus className="w-5 h-5" />
              Add Credential
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative max-w-full md:max-w-none w-full max-w-md mx-auto overflow-hidden bg-background md:bg-secondary/20">
        <div className="flex-1 overflow-y-auto w-full md:p-8 pb-20 md:pb-8">
          <div className="max-w-3xl mx-auto w-full bg-background md:rounded-2xl md:shadow-sm md:border min-h-full md:min-h-0">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/80 backdrop-blur-lg z-50 safe-area-bottom">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-testid={`mobile-nav-${item.label.toLowerCase()}`}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors cursor-pointer",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", location === item.href ? "fill-primary/20" : "")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
