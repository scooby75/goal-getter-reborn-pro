import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Users } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'blocked';
  created_at: string;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('user_id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      loadProfiles();
    };

    checkAdminAuth();
  }, [navigate, toast]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'blocked') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);

      if (error) throw error;

      setProfiles(profiles.map(profile => 
        profile.user_id === userId ? { ...profile, status } : profile
      ));

      toast({
        title: "Sucesso",
        description: `Usuário ${status === 'approved' ? 'aprovado' : 'bloqueado'} com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      approved: { variant: "default" as const, label: "Aprovado" },
      blocked: { variant: "destructive" as const, label: "Bloqueado" }
    };
    
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="h-8 w-8" />
              Painel Administrativo
            </h1>
            <p className="text-gray-600">Gerencie usuários e permissões</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {profiles.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {profiles.filter(p => p.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                        {profile.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(profile.status)}</TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {profile.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateUserStatus(profile.user_id, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateUserStatus(profile.user_id, 'blocked')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Bloquear
                            </Button>
                          </>
                        )}
                        {profile.status === 'approved' && profile.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateUserStatus(profile.user_id, 'blocked')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Bloquear
                          </Button>
                        )}
                        {profile.status === 'blocked' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(profile.user_id, 'approved')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;