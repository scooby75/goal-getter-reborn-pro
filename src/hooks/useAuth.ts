import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'blocked';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega perfil do usuário do banco, se existir
  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading profile:', error);
        return null;
      }

      if (!data) {
        console.log('Profile not found, creating new profile...');
        // Criar perfil padrão se não existir
        const { error: insertError, data: insertedProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: session?.user?.email ?? '',
            full_name: '',
            role: 'user',
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return null;
        }

        return insertedProfile;
      }

      return data;
    } catch (error) {
      console.error('Exception loading profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      setLoading(true);
      console.log('Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await loadProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await loadProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!session,
    isApproved: profile?.status === 'approved',
    isAdmin: profile?.role === 'admin' && profile?.status === 'approved',
    refetchProfile: async () => {
      if (!user) return;
      setLoading(true);
      const profileData = await loadProfile(user.id);
      setProfile(profileData);
      setLoading(false);
    }
  };
};
