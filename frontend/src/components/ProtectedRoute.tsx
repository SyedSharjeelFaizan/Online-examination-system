import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

export function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: "STUDENT" | "ADMIN" }) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Redirect to="/login" />;
  }

  if (role && user.role !== role) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
