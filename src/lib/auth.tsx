import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from './api';

interface User {
  id: number;
  email: string;
}

interface Profile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  setor: string | null;
  suspended_until: string | null;
  blocked: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, setor: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isProfessional: boolean;
  isDeveloper: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
  mustChangePassword: boolean;
  suspendedUntil: Date | null;
  refreshProfile: () => Promise<void>;
  userRole: 'admin' | 'professional' | 'user' | 'developer' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'professional' | 'user' | 'developer' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authApi.getProfile();
      
      if (response.error) {
        console.error('Error fetching profile:', response.error);
        // Token inválido, limpar
        localStorage.removeItem('auth_token');
        setUser(null);
        setProfile(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      if (response.data) {
        setUser(response.data.user);
        setProfile({
          ...response.data.profile,
          blocked: response.data.profile?.blocked || false,
          must_change_password: response.data.profile?.must_change_password || false,
        });
        setUserRole(response.data.role as 'admin' | 'professional' | 'user' | 'developer' || 'user');
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data) {
        // Check if account is blocked
        if (response.data.profile?.blocked) {
          authApi.logout();
          return { error: new Error('Conta bloqueada. Contate os administradores.') };
        }

        setUser(response.data.user);
        setProfile({
          ...response.data.profile,
          blocked: response.data.profile?.blocked || false,
          must_change_password: response.data.profile?.must_change_password || false,
        });
        setUserRole(response.data.role as 'admin' | 'professional' | 'user' | 'developer' || 'user');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, setor: string) => {
    try {
      const response = await authApi.register(email, password, name, setor);

      if (response.error) {
        if (response.error.includes('already registered') || response.error.includes('já cadastrado')) {
          return { error: new Error('Este email já está cadastrado') };
        }
        return { error: new Error(response.error) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    authApi.logout();
    setProfile(null);
    setUser(null);
    setUserRole(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const suspendedUntil = profile?.suspended_until ? new Date(profile.suspended_until) : null;
  const isSuspended = suspendedUntil ? suspendedUntil > new Date() : false;
  const isBlocked = profile?.blocked || false;
  const mustChangePassword = profile?.must_change_password || false;
  const isAdmin = userRole === 'admin';
  const isProfessional = userRole === 'professional';
  const isDeveloper = userRole === 'developer';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isProfessional,
      isDeveloper,
      isSuspended,
      isBlocked,
      mustChangePassword,
      suspendedUntil,
      refreshProfile,
      userRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
