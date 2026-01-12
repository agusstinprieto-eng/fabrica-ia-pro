import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    isAuthenticated: boolean;
    hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
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

    useEffect(() => {
        // Check for stored session
        const storedUser = localStorage.getItem('costura-ia-user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem('costura-ia-user');
            }
        }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const userRecord = DEMO_USERS[email.toLowerCase()];

        if (userRecord && userRecord.password === password) {
            setUser(userRecord.user);
            setIsAuthenticated(true);
            localStorage.setItem('costura-ia-user', JSON.stringify(userRecord.user));
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('costura-ia-user');
    };

    const hasPermission = (allowedRoles: UserRole[]): boolean => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasPermission }}>
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
