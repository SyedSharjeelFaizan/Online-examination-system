import { useAuth } from "@/lib/auth";
import { Redirect, Link, useLocation } from "wouter";
import { LogOut, Bell, BookOpen, LayoutDashboard, LineChart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!token || !user || user.role !== "STUDENT") {
    return <Redirect to="/login" />;
  }

  const navItems = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/exams", label: "Exams", icon: BookOpen },
    { href: "/student/results", label: "Results", icon: Award },
    { href: "/student/analytics", label: "Analytics", icon: LineChart },
    { href: "/student/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary tracking-tight">ExamForge</h1>
          <p className="text-sm text-muted-foreground mt-1">Student Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
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
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
