import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [handledOAuth, setHandledOAuth] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, profile, loading: authLoading } = useAuth();

  // ✅ Processa redirecionamento OAuth após login com Google (código ?code=)
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession();

        if (error) {
          toast({
            title: "Erro na autenticação",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log("Sessão iniciada:", data);
          // Remove parâmetros da URL
          const cleanUrl = `${window.location.origin}/auth`;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.error("Erro ao trocar código por sessão:", err);
        toast({
          title: "Erro",
          description: "Não foi possível concluir o login.",
          variant: "destructive",
        });
      }
    };

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code && !handledOAuth) {
      setHandledOAuth(true);
      handleOAuthRedirect();
    }
  }, [toast, handledOAuth]);

  // ✅ Redireciona com base no status do perfil
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      switch (profile.status) {
        case "approved":
          navigate("/dashboard");
          break;
        case "pending":
          navigate("/pending");
          break;
        case "blocked":
          toast({
            title: "Acesso Bloqueado",
            description: "Sua conta foi bloqueada. Entre em contato com o suporte.",
            variant: "destructive",
          });
          break;
        default:
          console.warn("Status de perfil inesperado:", profile.status);
          break;
      }
    }
  }, [isAuthenticated, profile, authLoading, navigate, toast]);

  // ✅ Inicia login com Google (OAuth 2.0)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast({
          title: "Erro no Login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro no handleGoogleSignIn:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">⚽ Goals Stats</CardTitle>
          <CardDescription>
            Faça login para acessar as análises estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Entrando..." : "Entrar com Google"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              Ao fazer login, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>⚠️ Novos usuários precisam aguardar aprovação do administrador</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
