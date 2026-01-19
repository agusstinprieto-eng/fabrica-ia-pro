import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

export type UserRole = 'admin' | 'engineer' | 'manager' | 'operator';

interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    company: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing (unchanged)
const DEMO_USERS: Record<string, { password: string; user: User }> = {
    'admin@ia-agus.com': {
        password: 'admin123',
        user: {
            id: '1',
            email: 'admin@ia-agus.com',
            name: 'System Administrator',
            role: 'admin',
            company: 'IA.AGUS Labs',
        },
    },
    'agus@ia-agus.com': {
        password: 'godmode',
        user: {
            id: 'god-1',
            email: 'agus@ia-agus.com',
            name: 'Agustin Prieto',
            role: 'admin',
            company: 'IA.AGUS Global',
        },
    },
    'agus': {
        password: 'godmode',
        user: {
            id: 'god-1',
            email: 'agus',
            name: 'Agus God Mode',
            role: 'admin',
            company: 'IA.AGUS GOD VIEW',
        },
    },
    'negocio@ia-agus.com': {
        password: 'demo',
        user: {
            id: '5',
            email: 'negocio@ia-agus.com',
            name: 'Usuario Negocio',
            role: 'manager',
            company: 'Demo Manufacturing Co.',
        },
    },
    'ventas@ia-agus.com': {
        password: 'alfredo123',
        user: {
            id: '6',
            email: 'ventas@ia-agus.com',
            name: 'Director de Ventas',
            role: 'manager',
            company: 'IA.AGUS Labs',
        },
    },
    'engineer@company.com': {
        password: 'engineer123',
        user: {
            id: '2',
            email: 'engineer@company.com',
            name: 'Industrial Engineer',
            role: 'engineer',
            company: 'Demo Manufacturing Co.',
        },
    },
    'manager@company.com': {
        password: 'manager123',
        user: {
            id: '3',
            email: 'manager@company.com',
            name: 'Production Manager',
            role: 'manager',
            company: 'Demo Manufacturing Co.',
        },
    },
    'operator@company.com': {
        password: 'operator123',
        user: {
            id: '4',
            email: 'operator@company.com',
            name: 'Line Operator',
            role: 'operator',
            company: 'Demo Manufacturing Co.',
        },
    },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [analysisCount, setAnalysisCount] = useState(0);
    const [demoStartTime, setDemoStartTime] = useState<number | null>(null);

    // CHANGED: Dynamic Limit Logic
    const getMaxAnalyses = (email?: string) => {
        const demoEmails = [
            'negocio@ia-agus.com',
            'engineer@company.com',
            'manager@company.com',
            'operator@company.com'
        ];
        if (email && demoEmails.includes(email.toLowerCase())) return 3;
        return 500; // Pro Plan Default
    };

    const MAX_ANALYSES = getMaxAnalyses(user?.email);
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
                    company: session.user.user_metadata?.company || 'Organization'
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

    const login = async (email: string, password: string): Promise<boolean> => {
        // 1. TRY DEMO USERS FIRST
        const userRecord = DEMO_USERS[email.toLowerCase()];

        if (userRecord && userRecord.password === password) {
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
            isDemoExpired
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
