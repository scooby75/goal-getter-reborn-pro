import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GoalStatsConsulta } from "@/components/GoalStatsConsulta";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, signOut, isApproved } = useAuth();

  // Variáveis intermediárias para clareza
  const shouldWaitForLoad = loading || !profile?.status;
  const shouldRedirectToAuth = !user;
  const shouldRedirectToPending = !isApproved;

  useEffect(() => {
    console.log("Dashboard.tsx - useEffect triggered:", {
      loading,
      userExists: !!user,
      isApproved,
      profileStatus: profile?.status,
    });

    if (shouldWaitForLoad) return;

    if (shouldRedirectToAuth) {
      console.log("Dashboard.tsx - No user, redirecting to /auth");
      navigate("/auth");
    } else if (shouldRedirectToPending) {
      console.log("Dashboard.tsx - User not approved, redirecting to /pending");
      navigate("/pending");
    } else {
      console.log("Dashboard.tsx - User approved, staying on dashboard");
    }
  }, [
    shouldWaitForLoad,
    shouldRedirectToAuth,
    shouldRedirectToPending,
    navigate,
  ]);

  // Tela de carregamento
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ⚽ Goals Stats
            </h1>
            <p className="text-lg text-gray-600">
              Bem-vindo, {profile.full_name || user.email}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {profile.role === "admin" && (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Painel Admin
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <GoalStatsConsulta />
      </div>
    </div>
  );
};

export default Dashboard;
