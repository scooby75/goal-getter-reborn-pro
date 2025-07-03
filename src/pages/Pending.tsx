import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mail } from "lucide-react";

const Pending = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Clock className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Aprovação Pendente</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Aguardando Aprovação</span>
            </div>
            <p className="text-sm text-yellow-700">
              Um administrador precisa aprovar sua conta antes que você possa acessar 
              as funcionalidades da plataforma. Você receberá um email quando sua 
              conta for aprovada.
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>
              Isso pode levar até 24 horas. Se você não receber uma resposta 
              em breve, entre em contato conosco.
            </p>
          </div>

          <Button variant="outline" onClick={handleSignOut} className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pending;