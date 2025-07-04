-- ========================================
-- HABILITAR RLS E POLÍTICAS DE PERFIL
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY "Users can view their own profile" ON public.profiles';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY "Users can update their own profile" ON public.profiles';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY "Admins can view all profiles" ON public.profiles';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all profiles' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY "Admins can update all profiles" ON public.profiles';
  END IF;
END;
$$;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND role = 'admin'::user_role 
        AND status = 'approved'::user_status
    )
  );

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND role = 'admin'::user_role 
        AND status = 'approved'::user_status
    )
  );

-- ========================================
-- FUNÇÃO: Criar perfil automaticamente após novo usuário
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- ========================================
-- TRIGGER: Executa a função após criação de auth.users
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGER: Atualiza updated_at antes de UPDATE
-- ========================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
