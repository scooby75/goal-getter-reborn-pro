
import { GoalStatsConsulta } from "@/components/GoalStatsConsulta";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ⚽ Goals Stats
          </h1>
          <p className="text-lg text-gray-600">
            Analise estatísticas detalhadas
          </p>
        </div>
        <GoalStatsConsulta />
      </div>
    </div>
  );
};

export default Index;
