
import { GoalStatsConsulta } from "@/components/GoalStatsConsulta";
import { AuthButton } from "@/components/AuthButton";
import { AuthGuard } from "@/components/AuthGuard";
import { UpdateStatusDisplay } from "@/components/UpdateStatusDisplay";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ⚽ Goals Stats
              </h1>
              <p className="text-lg text-gray-600">
                Analise estatísticas detalhadas
              </p>
            </div>
            <div className="flex-shrink-0 space-x-2">
              <Button asChild variant="outline">
                <Link to="/auth">Login</Link>
              </Button>
            </div>
          </div>
          
          {/* Welcome content for non-authenticated users */}
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to Goals Stats
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Access detailed football statistics and analytics. Please sign in to view the stats dashboard.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireApproval>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Auth */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ⚽ Goals Stats
              </h1>
              <p className="text-lg text-gray-600">
                Analise estatísticas detalhadas
              </p>
            </div>
            <div className="flex-shrink-0">
              <AuthButton />
            </div>
          </div>
          
          {/* Update Status Display */}
          <UpdateStatusDisplay />
          
          <GoalStatsConsulta />
        </div>
      </div>
    </AuthGuard>
  );
};

export default Index;
