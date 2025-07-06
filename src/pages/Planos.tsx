import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PlanSelection = () => {
  const navigate = useNavigate();
  
  const plans = [
    {
      name: "Mensal",
      price: "R$ 19,90",
      period: "mensal",
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Suporte por email",
        "Atualizações semanais"
      ],
      url: "https://buy.stripe.com/5kQdR86593wOb8C5r8eZ206"
    },
    {
      name: "Semestral",
      price: "R$ 99,90",
      period: "semestral",
      popular: true,
      features: [
        "Tudo do plano Mensal",
        "Economia de 15%",
        "Suporte prioritário por e-mail",
        "Relatórios exclusivos"
      ],
      url: "https://buy.stripe.com/5kQ7sK0KP9Vc2C6g5MeZ207"
    },
    {
      name: "Anual",
      price: "R$ 149,90",
      period: "anual",
      features: [
        "Tudo do plano Semestral",        
        "Economia de 40%",        
        "Suporte prioritário Telegram",        
        "Dashboard personalizado",
        "Acesso beta a novos recursos"
      ],
      url: "https://buy.stripe.com/cNi28qgJN5EWccGg5MeZ208"
    }
  ];

  return (
    <div className="min-h-screen gradient-crypto">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-xl glass-effect crypto-shadow mr-3">
              <BarChart3 className="h-8 w-8 text-crypto-light" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Escolha Seu Plano Goals Stats
            </h1>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-crypto-light mb-8 leading-relaxed">
              Libere todo o potencial da análise estatística de gols. <br className="hidden md:block" />
              <span className="text-white font-medium">7 dias de garantia ou seu dinheiro de volta.</span>
            </p>
          </div>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative transition-all duration-300 hover:scale-[1.02] ${
                plan.popular ? 'md:-translate-y-4' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    MAIS POPULAR
                  </div>
                </div>
              )}
              
              <Card className={`h-full border-0 shadow-xl ${
                plan.popular 
                  ? 'ring-2 ring-blue-500 bg-white/90' 
                  : 'bg-white/80 backdrop-blur-sm'
              }`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl text-center text-gray-800 font-bold">
                    {plan.name}
                  </CardTitle>
                  
                  <div className="text-center mt-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1.5">/{plan.period}</span>
                    
                    {plan.period !== 'mensal' && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Economize {plan.period === 'anual' ? '40%' : '15%'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="text-green-500 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-3">
                    <Button
                      className={`w-full py-6 text-base font-bold rounded-xl ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                          : 'bg-crypto-steel hover:bg-crypto-blue text-white'
                      }`}
                      asChild
                    >
                      <a href={plan.url} target="_blank" rel="noopener noreferrer">
                        Assinar Agora
                      </a>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-crypto-light text-crypto-light hover:bg-white/90"
                      onClick={() => navigate('/demo')}
                    >
                      Ver Demonstração
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Garantia */}
        <div className="text-center mt-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <Shield className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-crypto-light text-sm">
              <span className="font-bold text-white">Garantia de 7 dias</span> - Cancele a qualquer momento
            </span>
          </div>
          
          <p className="text-crypto-light mt-8 text-sm">
            Todos os planos incluem acesso completo imediato. Não cobramos taxas de cancelamento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;