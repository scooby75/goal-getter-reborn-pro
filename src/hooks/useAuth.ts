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
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
        setLoadingSession(false);
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

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // perfil não encontrado (PostgREST)
            setProfile(null);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
        }
      } catch (err: any) {
        console.error("Erro ao carregar perfil:", err.message || err);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
      window.location.href = "https://goalstats.vercel.app/";
    } catch (err: any) {
      console.error("Erro ao sair:", err.message || err);
    }
  };

  const loading = loadingSession || loadingProfile;
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
