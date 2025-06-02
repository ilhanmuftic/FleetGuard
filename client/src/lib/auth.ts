import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial user session & profile
    const getUserProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        const { data, error } = await supabase
          .from<UserProfile>("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error.message);
          setUser(null);
        } else {
          setUser(data);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getUserProfile();

    // Listen to auth state changes
    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data, error } = await supabase
          .from<UserProfile>("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error.message);
          setUser(null);
        } else {
          setUser(data);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);  // On error, stop loading immediately
      throw error;
    }
    // Don't set isLoading(false) here! 
    // The onAuthStateChange listener will update user & loading state accordingly
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isEmployee: user?.role === "employee",
  };
}
