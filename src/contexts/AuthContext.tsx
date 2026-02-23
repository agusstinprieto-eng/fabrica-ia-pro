import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

export type UserRole = 'admin' | 'engineer' | 'manager' | 'operator';

interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    company: string;
    analysisLimit?: number;
    supportMinutes?: number;
    isUnlimited?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    analysisCount: number;
    demoStartTime: number | null;
    incrementAnalysis: () => boolean;
    remainingAnalyses: number;
    isDemoExpired: boolean;
    supportMinutes: number;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    updatePassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing (unchanged)
const DEMO_USERS: Record<string, { password: string; user: User }> = {
    'agus': {
        password: import.meta.env.VITE_GODMODE_PASSWORD || 'godmode_default',
        user: {
            id: 'god-1',
            email: 'agus',
            name: 'Agus God Mode',
            role: 'admin',
            company: 'IA.AGUS GOD VIEW',
            isUnlimited: true,
        },
    },
    'memo@ia-agus.com': {
        password: 'mesta',
        user: {
            id: 'sales-1',
            email: 'memo@ia-agus.com',
            name: 'Memo Sales',
            role: 'manager',
            company: 'IA.AGUS SALES',
            analysisLimit: 100,
            supportMinutes: 5
        }
    },
    'ronald@ia-agus.com': {
        password: 'honduras',
        user: {
            id: 'sales-honduras',
            email: 'ronald@ia-agus.com',
            name: 'Ronald Honduras',
            role: 'manager',
            company: 'IA.AGUS HONDURAS',
            analysisLimit: 500,
            supportMinutes: 10
        }
    },
    // HORACIO is a REAL CLIENT — authenticates via Supabase Auth (not demo)
    // Email: horacio@ia-agus.com | Password managed in Supabase Dashboard
    'enrique': {
        password: 'galindo',
        user: {
            id: 'enrique-demo',
            email: 'enrique',
            name: 'Enrique Galindo',
            role: 'manager',
            company: 'MANUFACTURA IA PRO',
            analysisLimit: 500,
            supportMinutes: 60
        }
    },
    'jorge': {
        password: 'perez',
        user: {
            id: 'jorge-joper',
            email: 'jorge',
            name: 'Jorge Pérez - Grupo Joper',
            role: 'manager',
            company: 'GRUPO JOPER',
            analysisLimit: 500,
            supportMinutes: 60
        }
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [analysisCount, setAnalysisCount] = useState(0);
    const [demoStartTime, setDemoStartTime] = useState<number | null>(null);

    // CHANGED: Dynamic Limit Logic
    const getMaxAnalyses = (currentUser?: User | null) => {
        if (!currentUser) return 3; // Default public demo
        if (currentUser.analysisLimit !== undefined) return currentUser.analysisLimit;

        // Legacy/Fallback Logic
        const email = currentUser.email;
        const demoEmails = [
            'negocio@ia-agus.com',
            'engineer@company.com',
            'manager@company.com',
            'operator@company.com'
        ];
        if (email && demoEmails.includes(email.toLowerCase())) return 3;
        if (email === 'ronald@ia-agus.com') return 500; // Custom limit for Honduras Sales
        return 500; // Pro Plan Default
    };

    const MAX_ANALYSES = getMaxAnalyses(user);
    const DEMO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (Monthly Cycle)

    useEffect(() => {
        // Check for stored session (Legacy/Demo)
        const storedUser = localStorage.getItem('costura-ia-user');
        const storedCount = localStorage.getItem('costura-ia-analysis-count');
        const storedStart = localStorage.getItem('costura-ia-demo-start');
        const storedMonth = localStorage.getItem('costura-ia-month');

        // Monthly Reset Logic
        const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

        if (storedMonth !== currentMonth) {
            // New month detected, reset count
            setAnalysisCount(0);
            localStorage.setItem('costura-ia-analysis-count', '0');
            localStorage.setItem('costura-ia-month', currentMonth);
            // Optionally reset start time if strictly monthly
            const now = Date.now();
            setDemoStartTime(now);
            localStorage.setItem('costura-ia-demo-start', now.toString());
        } else {
            // Same month, load stored values
            if (storedCount) setAnalysisCount(parseInt(storedCount, 10));
            if (storedStart) setDemoStartTime(parseInt(storedStart, 10));
        }

        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('costura-ia-user');
            }
        }

        // SUPABASE AUTH LISTENER
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Map Supabase User to App User
                const newUser: User = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.full_name || session.user.email || 'User',
                    role: session.user.user_metadata?.role as UserRole || 'manager', // Default to manager if undefined
                    company: session.user.user_metadata?.company || 'Organization',
                    analysisLimit: session.user.user_metadata?.analysisLimit,
                    supportMinutes: session.user.user_metadata?.supportMinutes
                };
                setUser(newUser);
                setIsAuthenticated(true);
                localStorage.setItem('costura-ia-user', JSON.stringify(newUser));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('costura-ia-user');
            }
        });

        return () => {
            subscription.unsubscribe();
        };

    }, []);

    const login = async (email: string, passwordInput: string): Promise<boolean> => {
        const password = passwordInput.trim();
        // 1. TRY DEMO USERS FIRST
        const normalizedEmail = email.toLowerCase().trim();
        const userRecord = DEMO_USERS[normalizedEmail];

        console.log("Attempting login for:", normalizedEmail, "Password match?", userRecord?.password === password);

        if (userRecord && userRecord.password === password) {
            console.log("Demo user found:", userRecord.user);
            // Simulate delay
            await new Promise((resolve) => setTimeout(resolve, 800));

            setUser(userRecord.user);
            setIsAuthenticated(true);
            localStorage.setItem('costura-ia-user', JSON.stringify(userRecord.user));

            // Initialize demo limits...
            initializeDemoLimits();
            return true;
        }

        // 2. TRY SUPABASE AUTH
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error("Supabase Login Error:", error.message);
                return false;
            }

            if (data.user) {
                // The onAuthStateChange listener will handle setting the user state
                initializeDemoLimits();
                return true;
            }

        } catch (err) {
            console.error("Login Exception:", err);
            return false;
        }

        return false;
    };

    const initializeDemoLimits = () => {
        if (!localStorage.getItem('costura-ia-demo-start')) {
            const now = Date.now();
            setDemoStartTime(now);
            localStorage.setItem('costura-ia-demo-start', now.toString());
            setAnalysisCount(0);
            localStorage.setItem('costura-ia-analysis-count', '0');
            localStorage.setItem('costura-ia-month', new Date().toISOString().slice(0, 7));
        }
    }

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('costura-ia-user');
        await supabase.auth.signOut();
    };

    const incrementAnalysis = (): boolean => {
        // 1. Check Time Limit
        if (demoStartTime) {
            const now = Date.now();
            if (now - demoStartTime > DEMO_DURATION_MS) {
                return false; // Time expired
            }
        }

        // 2. Check Count Limit
        if (analysisCount >= MAX_ANALYSES) {
            return false; // Max analyses reached
        }

        const newCount = analysisCount + 1;
        setAnalysisCount(newCount);
        localStorage.setItem('costura-ia-analysis-count', newCount.toString());
        return true;
    };

    const isDemoExpired = !!(demoStartTime && (Date.now() - demoStartTime > DEMO_DURATION_MS));

    const hasPermission = (allowedRoles: UserRole[]): boolean => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    // ... previous code ...

    const updateProfile = async (data: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        // 1. DEMO USER UPDATE
        const demoEmails = Object.keys(DEMO_USERS);
        if (demoEmails.includes(user.email.toLowerCase())) {
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            // Update in DEMO_USERS for current session consistency (optional/mock)
            if (DEMO_USERS[user.email.toLowerCase()]) {
                DEMO_USERS[user.email.toLowerCase()].user = updatedUser;
            }
            localStorage.setItem('costura-ia-user', JSON.stringify(updatedUser));
            return true;
        }

        // 2. SUPABASE USER UPDATE
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: data.name,
                    company: data.company,
                    // role is usually protected, but allowing update for now if needed or just ignoring it
                }
            });

            if (error) {
                console.error("Profile Update Error:", error.message);
                return false;
            }

            // Update local state
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('costura-ia-user', JSON.stringify(updatedUser));
            return true;
        } catch (err) {
            console.error("Profile Update Exception:", err);
            return false;
        }
    };

    const updatePassword = async (password: string): Promise<boolean> => {
        if (!user) return false;

        // 1. DEMO USER PASSWORD UPDATE (Mock)
        const demoEmails = Object.keys(DEMO_USERS);
        if (demoEmails.includes(user.email.toLowerCase())) {
            // In a real app we wouldn't let demo users change passwords, 
            // but for "God Mode" or testing, we can simulate it or just allow it in memory.
            // For now, let's just return true to simulate success.
            console.log(`[DEMO] Password updated for ${user.email} to: ${password}`);
            return true;
        }

        // 2. SUPABASE PASSWORD UPDATE
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                console.error("Password Update Error:", error.message);
                return false;
            }
            return true;
        } catch (err) {
            console.error("Password Update Exception:", err);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            hasPermission,
            analysisCount,
            demoStartTime,
            incrementAnalysis,
            remainingAnalyses: Math.max(0, MAX_ANALYSES - analysisCount),
            isDemoExpired,
            supportMinutes: user?.supportMinutes || 0,
            updateProfile,
            updatePassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
