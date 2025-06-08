import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabase';
import { UserProfile } from './types';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => {
        throw new Error('AuthContext not initialized');
    },
    logout: async () => {
        throw new Error('AuthContext not initialized');
    },
    isAuthenticated: false,
    isAdmin: false,
    isEmployee: false,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);
    const initialCheckComplete = useRef(false);

    const fetchUserProfile = async (userId: string) => {
        if (isFetchingProfile) {
            console.log("[fetchUserProfile] Already fetching profile, skipping...");
            return;
        }

        console.log(`[fetchUserProfile] Fetching profile for userId: ${userId}`);
        setIsFetchingProfile(true);
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("[fetchUserProfile] Error fetching user profile:", error.message);
                setUser(null);
                return null;
            } else {
                console.log("[fetchUserProfile] User profile fetched:", data);
                setUser(data);
                return data;
            }
        } catch (err) {
            console.error("[fetchUserProfile] Unexpected error:", err);
            setUser(null);
            return null;
        } finally {
            setIsFetchingProfile(false);
        }
    };

    useEffect(() => {
        console.log("[AuthProvider] Setting up auth state listener");
        let mounted = true;
        let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

        // First check initial session
        const checkInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!mounted) return;

                if (error) {
                    console.error("[checkInitialSession] Error getting session:", error.message);
                    setUser(null);
                    return;
                }

                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log("[checkInitialSession] No user in session");
                    setUser(null);
                }
            } catch (err) {
                console.error("[checkInitialSession] Unexpected error:", err);
                if (mounted) {
                    setUser(null);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    initialCheckComplete.current = true;

                    // Only set up the auth listener after initial check is complete
                    authListener = supabase.auth.onAuthStateChange(async (event, session) => {
                        if (!mounted) return;
                        console.log("[onAuthStateChange] Auth state changed. Event:", event);

                        if (event === 'SIGNED_OUT') {
                            setUser(null);
                            setIsLoading(false);
                            return;
                        }

                        if (session?.user) {
                            setIsLoading(true);
                            await fetchUserProfile(session.user.id);
                            setIsLoading(false);
                        }
                    });
                }
            }
        };

        checkInitialSession();

        return () => {
            console.log("[AuthProvider] Cleaning up subscription");
            mounted = false;
            if (authListener?.data.subscription) {
                authListener.data.subscription.unsubscribe();
            }
        };
    }, []);

    const login = async (email: string, password: string) => {
        console.log(`[login] Logging in user: ${email}`);
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error("[login] Error logging in:", error.message);
                throw error;
            }

            if (data.session?.user) {
                await fetchUserProfile(data.session.user.id);
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        console.log("[logout] Logging out");
        setIsLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isLoading: isLoading || isFetchingProfile,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isEmployee: user?.role === "employee",
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
} 