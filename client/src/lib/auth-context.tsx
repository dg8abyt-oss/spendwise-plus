import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Tracker } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  currentTracker: Tracker | null;
  isLoading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  register: (pin: string, currency: "INR" | "USD") => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setCurrentTracker: (tracker: Tracker | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentTracker, setCurrentTracker] = useState<Tracker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("spendwise_user");
    const storedTracker = localStorage.getItem("spendwise_tracker");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("spendwise_user");
      }
    }
    if (storedTracker) {
      try {
        setCurrentTracker(JSON.parse(storedTracker));
      } catch {
        localStorage.removeItem("spendwise_tracker");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("spendwise_user", JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.message || "Invalid PIN" };
    } catch {
      return { success: false, error: "Connection error" };
    }
  };

  const register = async (pin: string, currency: "INR" | "USD"): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, preferredCurrency: currency }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("spendwise_user", JSON.stringify(data.user));
        return { success: true };
      }
      return { success: false, error: data.message || "Registration failed" };
    } catch {
      return { success: false, error: "Connection error" };
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentTracker(null);
    localStorage.removeItem("spendwise_user");
    localStorage.removeItem("spendwise_tracker");
  };

  const handleSetCurrentTracker = (tracker: Tracker | null) => {
    setCurrentTracker(tracker);
    if (tracker) {
      localStorage.setItem("spendwise_tracker", JSON.stringify(tracker));
    } else {
      localStorage.removeItem("spendwise_tracker");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentTracker,
        isLoading,
        login,
        register,
        logout,
        setCurrentTracker: handleSetCurrentTracker,
      }}
    >
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
