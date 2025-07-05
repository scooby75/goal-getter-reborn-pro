import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    "Análise estatística completa de gols",
    "Dados atualizados automaticamente",
    "Filtros avançados por liga e time",
    "Visualização de momentos dos gols",
    "Estatísticas detalhadas casa/fora",
    "Exportação de relatórios"
  ];

  const plans = [
    {
      name: "Básico",
      price: "R$ 19,90",
      period: "mensal",
      features: [
        "Acesso às estatísticas básicas",
        "5 consultas por dia",
        "Suporte por email"
      ]
    },
    {
      name: "Premium",
      price: "R$ 99,90",
      period: "semestral",
      popular: true,
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Filtros avançados",
        "Exportação de dados",
        "Suporte prioritário"
      ]
    },
    {
      name: "Anual",
      price: "R$ 149,90",
      period: "anual",
      features: [
        "Tudo do plano Premium",        
        "Economia de 40%",
        "Acesso antecipado a novas features",
        "Consultoria personalizada"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            ⚽ Goals Stats
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A plataforma mais completa para análise estatística de gols. 
            Tome decisões mais inteligentes com dados precisos e atualizados.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">Começar Agora</Link>
            </Button>
            <Button variant="outline" size="lg">
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Funcionalidades Principais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                <Check className="text-green-500 h-5 w-5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Escolha Seu Plano
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="text-green-500 h-4 w-4 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth">Assinar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de analistas que já usam o Goals Stats para 
            tomar decisões mais assertivas no mundo dos esportes.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Criar Conta Grátis</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
