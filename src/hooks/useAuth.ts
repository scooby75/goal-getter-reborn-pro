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

  // Obtém sessão inicial e escuta mudanças de autenticação
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

  // Carrega perfil com base no usuário logado
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

  // Normalização segura de status
  const normalizedStatus = (profile?.status || '').trim().toLowerCase();
  const isApproved = normalizedStatus === 'approved';
  const isAdmin = isApproved && profile?.role === 'admin';

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    isApproved,
    isAdmin
  };
};
