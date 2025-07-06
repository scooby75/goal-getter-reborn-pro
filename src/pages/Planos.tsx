import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, TrendingUp, BarChart3, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Planos = () => {
  const navigate = useNavigate();

  const PLANS = [
    {
      id: "monthly",
      name: "Mensal",
      price: "R$ 19,90",
      originalPrice: "R$ 19,90",
      period: "mensal",
      discount: "",
      features: [
        "Acesso completo às estatísticas",
        "Consultas ilimitadas",
        "Suporte por email",
        "Atualizações semanais"
      ],
      cta: "Assinar Mensalmente",
      url: "https://buy.stripe.com/5kQdR86593wOb8C5r8eZ206"
    },
    {
      id: "semiannual",
      name: "Semestral",
      price: "R$ 99,90",
      originalPrice: "R$ 119,40",
      period: "semestral",
      discount: "17% de desconto",
      popular: true,
      features: [
        "Tudo do plano Mensal",
        "Economia imediata",
        "Suporte prioritário",
        "Relatórios exclusivos"
      ],
      cta: "Economizar 17%",
      url: "https://buy.stripe.com/5kQ7sK0KP9Vc2C6g5MeZ207"
    },
    {
      id: "annual",
      name: "Anual",
      price: "R$ 149,90",
      originalPrice: "R$ 238,80",
      period: "anual",
      discount: "37% de desconto",
      features: [
        "Tudo do plano Semestral",        
        "Maior economia",        
        "Suporte VIP Telegram",        
        "Dashboard premium",
        "Acesso beta"
      ],
      cta: "Economizar 37%",
      url: "https://buy.stripe.com/cNi28qgJN5EWccGg5MeZ208"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-crypto-dark to-crypto-darker">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12 md:mb-20">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg mr-3">
              <BarChart3 className="h-8 w-8 text-crypto-light" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Escolha Seu Plano
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-crypto-light mb-2 leading-relaxed">
              Libere todo o potencial da análise estatística de gols
            </p>
            <div className="inline-flex items-center bg-green-900/20 text-green-400 text-sm px-4 py-2 rounded-full">
              <Shield className="h-4 w-4 mr-2" />
              Garantia de 7 dias - Cancele quando quiser
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={\`relative transition-transform duration-300 hover:scale-[1.02] \${plan.popular ? 'md:-translate-y-3' : ''}\`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    MAIS POPULAR
                  </div>
                </div>
              )}

              <Card className={\`h-full border-0 overflow-hidden \${plan.popular ? 'ring-2 ring-amber-500 bg-gradient-to-b from-white to-gray-100' : 'bg-white/90 backdrop-blur-sm'}\`}>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl text-center font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="text-center mb-6">
                    <div className="flex justify-center items-baseline">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 ml-1.5 text-lg">/{plan.period}</span>
                    </div>

                    {plan.discount && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">
                          {plan.discount}
                        </span>
                        {plan.originalPrice && (
                          <span className="block text-xs text-gray-500 line-through mt-1">
                            {plan.originalPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 px-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="text-green-500 h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3">
                    <Button
                      className={\`w-full py-5 text-base font-bold rounded-lg \${plan.popular ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg' : 'bg-crypto-steel hover:bg-crypto-blue text-white'}\`}
                      asChild
                    >
                      <a href={plan.url} target="_blank" rel="noopener noreferrer">
                        {plan.cta}
                      </a>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => navigate('/demo')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Ver Demonstração
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 max-w-3xl mx-auto">
          <p className="text-crypto-light text-sm">
            Pagamento seguro processado por Stripe • Todos os valores em BRL
          </p>
          <p className="text-crypto-light/70 mt-4 text-xs">
            Ao assinar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
};
