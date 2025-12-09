import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, Database, Code } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [devSetupLoading, setDevSetupLoading] = useState(false);
  const [showSetupButton, setShowSetupButton] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkSetupButtonVisibility = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'show_setup_button')
        .maybeSingle();
      
      if (data?.value && typeof data.value === 'object' && 'visible' in data.value) {
        setShowSetupButton((data.value as { visible: boolean }).visible);
      }
    };
    checkSetupButtonVisibility();
  }, []);

  const handleSetupInitialData = async () => {
    setSetupLoading(true);
    try {
      const response = await supabase.functions.invoke('setup-initial-users');
      
      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Dados iniciais criados!',
        description: 'Usuários, especialidades e profissionais foram configurados.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar dados',
        description: error.message || 'Falha ao executar setup inicial',
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCreateDeveloper = async () => {
    setDevSetupLoading(true);
    try {
      const response = await supabase.functions.invoke('create-developer-account');
      
      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Conta de desenvolvedor criada!',
        description: 'Email: desenvolvimento@anadem.com.br | Senha: 123456',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar desenvolvedor',
        description: error.message || 'Falha ao criar conta de desenvolvedor',
      });
    } finally {
      setDevSetupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: result.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: error.message,
      });
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/anademicon.png" 
              alt="Ícone Anadem" 
              style={{ height: '120px', width: 'auto' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal de Agendamentos</h1>
          <p className="text-muted-foreground mt-2">Massoterapia • Psicólogo • Nutricionista</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <LogIn className="h-5 w-5" />
              Entrar no Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showSetupButton && (
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleSetupInitialData}
              disabled={setupLoading}
            >
              {setupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Configurar Dados Iniciais
            </Button>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleCreateDeveloper}
              disabled={devSetupLoading}
            >
              {devSetupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Code className="h-4 w-4" />
              )}
              Criar Conta de Desenvolvedor
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
