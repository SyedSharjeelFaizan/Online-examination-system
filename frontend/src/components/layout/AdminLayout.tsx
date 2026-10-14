import { useAuth } from "@/lib/auth";
import { Redirect, Link, useLocation } from "wouter";
import { LogOut, Bell, Database, Users, LayoutDashboard, MonitorPlay, BrainCircuit, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!token || !user || user.role !== "ADMIN") {
    return <Redirect to="/login" />;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/exams", label: "Exams", icon: Database },
    { href: "/admin/questions", label: "Questions", icon: Database },
    { href: "/admin/ai-generator", label: "AI Generator", icon: BrainCircuit },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/monitor", label: "Live Monitor", icon: MonitorPlay },
    { href: "/admin/results", label: "Results", icon: Activity },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary tracking-tight">ExamForge</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Console</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/admin');
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="truncate">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-muted/20">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
