import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GoalStatsConsulta } from "@/components/GoalStatsConsulta";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { HeadToHeadCard } from '@/components/HeadToHeadCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, signOut, isApproved } = useAuth();

  // Estados para times selecionados dinamicamente (exemplo simples)
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  const shouldWaitForLoad = loading || !profile?.status;
  const shouldRedirectToAuth = !user;
  const shouldRedirectToPending = !isApproved;

  useEffect(() => {
    if (shouldWaitForLoad) return;

    if (shouldRedirectToAuth) {
      navigate("/auth");
    } else if (shouldRedirectToPending) {
      navigate("/pending");
    }
  }, [
    shouldWaitForLoad,
    shouldRedirectToAuth,
    shouldRedirectToPending,
    navigate,
  ]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">⚽ Goals Stats</h1>
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

        {/* Inputs simples para seleção dos times */}
        <div className="my-6 flex flex-col md:flex-row gap-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Digite o time 1"
            value={team1}
            onChange={e => setTeam1(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
          <input
            type="text"
            placeholder="Digite o time 2"
            value={team2}
            onChange={e => setTeam2(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          />
        </div>

        {/* Exibe HeadToHeadCard somente se ambos times forem preenchidos */}
        {team1 && team2 && (
          <HeadToHeadCard team1={team1} team2={team2} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
