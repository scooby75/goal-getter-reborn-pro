import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Atualiza sessão e usuário
  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Erro ao obter sessão:', error.message);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Carrega perfil quando usuário mudar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Normalização do status (para evitar espaços ou capitalização errada)
  const normalizedStatus = profile?.status?.trim().toLowerCase();

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    isApproved: normalizedStatus === 'approved',
    isAdmin: profile?.role === 'admin' && normalizedStatus === 'approved'
  };
};
