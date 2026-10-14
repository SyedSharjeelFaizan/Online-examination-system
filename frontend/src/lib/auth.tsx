import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("examforge_token"));
  const [user, setUser] = useState<User | null>(() => {
    const userStr = localStorage.getItem("examforge_user");
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("examforge_token", token);
    } else {
      localStorage.removeItem("examforge_token");
    }

    if (user) {
      localStorage.setItem("examforge_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("examforge_user");
    }
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
