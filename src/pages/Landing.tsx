
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
      name: "Básico",
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
      name: "Premium",
      price: "R$ 99,90",
      period: "semestral",
      popular: true,
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Suporte prioritário"
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
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-2xl glass-effect crypto-shadow mr-4">
              <BarChart3 className="h-12 w-12 text-crypto-light" />
            </div>
            <h1 className="text-6xl font-bold text-white">
              Goals Stats
            </h1>
          </div>
          <p className="text-xl text-crypto-light mb-8 max-w-3xl mx-auto leading-relaxed">
            A plataforma mais avançada para análise estatística de gols. 
            Tecnologia de ponta para decisões estratégicas precisas e confiáveis.
          </p>
          <div className="flex justify-center gap-6">
            <Button asChild size="lg" className="bg-crypto-steel hover:bg-crypto-blue text-white px-8 py-3 rounded-xl crypto-shadow transition-all duration-300 hover:scale-105">
              <Link to="/auth">
                <Shield className="mr-2 h-5 w-5" />
                Acessar Plataforma
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-crypto-light text-crypto-light hover:bg-crypto-light hover:text-crypto-dark px-8 py-3 rounded-xl transition-all duration-300">
              <Target className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex justify-center mb-16">
          <div className="glass-effect rounded-2xl p-6 crypto-shadow">
            <div className="flex items-center gap-4 text-crypto-light">
              <Lock className="h-6 w-6" />
              <span className="text-sm font-semibold">Segurança Bancária • Dados Criptografados • 99.9% Uptime</span>
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            Recursos Avançados
          </h2>
          <p className="text-crypto-light text-center mb-12 text-lg">
            Ferramentas profissionais para análise estatística de alto nível
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="glass-effect p-6 rounded-xl crypto-shadow transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-crypto-steel/20">
                    <Check className="text-crypto-light h-5 w-5" />
                  </div>
                  <span className="text-white font-medium">{feature}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            Planos Empresariais
          </h2>
          <p className="text-crypto-light text-center mb-12 text-lg">
            Soluções escaláveis para diferentes necessidades
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative glass-effect border-crypto-steel/30 crypto-shadow transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-crypto-steel shadow-2xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-crypto-steel to-crypto-blue text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                      Mais Escolhido
                    </div>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl text-white font-bold">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-5xl font-bold text-crypto-light">{plan.price}</span>
                    <span className="text-crypto-light/80 ml-2">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-crypto-steel/20">
                          <Check className="text-crypto-light h-4 w-4" />
                        </div>
                        <span className="text-white/90 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-crypto-steel to-crypto-blue text-white hover:shadow-xl hover:scale-105' 
                        : 'glass-effect border border-crypto-steel/50 text-crypto-light hover:bg-crypto-steel/20'
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
        <div className="text-center glass-effect rounded-3xl p-12 crypto-shadow">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Comece Sua Jornada Analítica
            </h2>
            <p className="text-crypto-light mb-8 text-lg leading-relaxed">
              Junte-se a centenas de analistas profissionais que confiam no Goals Stats 
              para estratégias vencedoras no mercado esportivo.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-crypto-steel to-crypto-blue text-white px-10 py-4 rounded-xl font-bold text-lg crypto-shadow transition-all duration-300 hover:scale-105" asChild>
              <Link to="/auth">
                <Shield className="mr-3 h-6 w-6" />
                Acesso Seguro Imediato
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
