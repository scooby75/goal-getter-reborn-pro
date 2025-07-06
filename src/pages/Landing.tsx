
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, TrendingUp, Lock, BarChart3, Target } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    "Análise estatística completa de gols",    
    "Média de gols da Liga",
    "Média de gols do time",
    "Média de gols do confronto (h2h)",
    "Frequência de gols 1T e 2T",
    "Tempo médio 1º gol",
    "Frequência que a equipe marca o 1º",    
    "Gols marcados e sofridos a cada 15min",
    "Placares mais prováveis",    
  ];

  const plans = [
    {
      name: "Mensal",
      price: "R$ 19,90",
      period: "mensal",
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Suporte por email"
      ],
      url: "https://buy.stripe.com/5kQdR86593wOb8C5r8eZ206"
    },
    {
      name: "Semestral",
      price: "R$ 99,90",
      period: "semestral",
      popular: true,
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Suporte prioritário por e-mail"
      ],
      url: "https://buy.stripe.com/5kQ7sK0KP9Vc2C6g5MeZ207"
    },
    {
      name: "Anual",
      price: "R$ 149,90",
      period: "anual",
      features: [
        "Tudo do plano Premium",        
        "Economia de 40%",        
        "Suporte prioritário Telegram",        
      ],
      url: "https://buy.stripe.com/cNi28qgJN5EWccGg5MeZ208"
    }
  ];

  return (
    <div className="min-h-screen gradient-crypto">
      {/* Hero Section */}
      <div className="container mx-auto px-3 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-xl glass-effect crypto-shadow mr-3">
              <BarChart3 className="h-8 w-8 text-crypto-light" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Goals Stats
            </h1>
          </div>
          <p className="text-base md:text-lg text-crypto-light mb-6 max-w-2xl mx-auto leading-relaxed px-4">
            A plataforma mais avançada para análise estatística de gols. 
            <p>Tecnologia de ponta para decisões estratégicas precisas e confiáveis.</p>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <Button asChild size="default" className="bg-crypto-steel hover:bg-crypto-blue text-white px-6 py-2 rounded-lg crypto-shadow transition-all duration-300 hover:scale-105">
              <Link to="/auth">
                <Shield className="mr-2 h-4 w-4" />
                Acessar Plataforma
              </Link>
            </Button>
            <Button variant="outline" size="default" className="border-crypto-light text-crypto-light hover:bg-crypto-light hover:text-crypto-dark px-6 py-2 rounded-lg transition-all duration-300">
              <Target className="mr-2 h-4 w-4" />
              Ver Demonstração
            </Button>
          </div>
        </div>


        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-3">
            Recursos Avançados
          </h2>
          <p className="text-crypto-light text-center mb-8 text-sm md:text-base">
            Ferramentas profissionais para análise estatística de alto nível
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto px-4">
            {features.map((feature, index) => (
              <div key={index} className="glass-effect p-4 rounded-lg crypto-shadow transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-crypto-steel/20">
                    <Check className="text-crypto-light h-4 w-4" />
                  </div>
                  <span className="text-white font-medium text-sm">{feature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-3">
            Escolha seu plano
          </h2>
          <p className="text-crypto-light text-center mb-8 text-sm md:text-base">
            Soluções escaláveis para diferentes necessidades
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-2xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      Mais Escolhido
                    </div>
                  </div>
                )}
                <CardHeader className="text-center pb-6 pt-6">
                  <CardTitle className="text-xl text-gray-800 font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl md:text-4xl font-bold text-gray-800">{plan.price}</span>
                    <span className="text-gray-600 ml-2 text-sm">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <div className="p-0.5 rounded-full bg-green-100">
                          <Check className="text-green-600 h-3 w-3" />
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-105' 
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    asChild
                  >
                    <a href={plan.url} target="_blank" rel="noopener noreferrer">
                      Assinar Plano
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center glass-effect rounded-2xl p-8 crypto-shadow">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Comece Sua Jornada 
            </h2>
            <p className="text-crypto-light mb-6 text-sm md:text-base leading-relaxed">
              Junte-se a centenas de analistas profissionais que confiam no Goals Stats
            </p>
            <Button size="default" className="bg-gradient-to-r from-crypto-steel to-crypto-blue text-white px-8 py-3 rounded-lg font-bold crypto-shadow transition-all duration-300 hover:scale-105" asChild>
              <Link to="/auth">
                <Shield className="mr-2 h-5 w-5" />
                Acessar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
