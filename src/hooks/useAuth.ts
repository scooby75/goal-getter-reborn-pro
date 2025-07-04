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

  // 🔐 Sessão inicial + listener de mudanças
  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (err: any) {
        console.error("Erro ao obter sessão:", err.message || err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🧾 Carrega o perfil completo
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        console.error("Erro ao carregar perfil:", err.message || err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // 🔒 Logout seguro com redirecionamento
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // redireciona para a página inicial após logout
      window.location.href = "https://goalstats.vercel.app/";
    } catch (err: any) {
      console.error("Erro ao sair:", err.message || err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

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
    isAdmin,
  };
};
