import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { Loader2 } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSetupButton, setShowSetupButton] = useState(true);
  const { themeToggleVisible, setThemeToggleVisible, loading: themeLoading } = useThemeSettings();
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'show_setup_button')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
    } else if (data?.value && typeof data.value === 'object' && 'visible' in data.value) {
      setShowSetupButton((data.value as { visible: boolean }).visible);
    }
    setLoading(false);
  };

  const handleToggleSetupButton = async (visible: boolean) => {
    setSaving(true);
    setShowSetupButton(visible);

    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value: { visible },
        updated_at: new Date().toISOString()
      })
      .eq('key', 'show_setup_button');

    if (error) {
      console.error('Error updating setting:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar a configuração.',
      });
      setShowSetupButton(!visible);
    } else {
      toast({
        title: 'Configuração salva',
        description: visible 
          ? 'Botão de setup está visível na página de login.' 
          : 'Botão de setup está oculto na página de login.',
      });
    }
    setSaving(false);
  };

  const handleToggleTheme = async (visible: boolean) => {
    setSaving(true);
    try {
      await setThemeToggleVisible(visible);
      toast({
        title: 'Configuração salva',
        description: visible 
          ? 'Seletor de tema escuro está visível para todos os usuários.' 
          : 'Seletor de tema escuro está oculto para todos os usuários.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar a configuração.',
      });
    }
    setSaving(false);
  };

  if (loading || themeLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>
            Gerencie as configurações gerais do sistema de agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="setup-button" className="text-base">
                Mostrar botão de Setup Inicial
              </Label>
              <p className="text-sm text-muted-foreground">
                Exibe o botão "Configurar Dados Iniciais" na página de login para criar usuários e especialidades de teste.
              </p>
            </div>
            <Switch
              id="setup-button"
              checked={showSetupButton}
              onCheckedChange={handleToggleSetupButton}
              disabled={saving}
            />
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle" className="text-base">
                  Mostrar seletor de tema escuro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permite que usuários alternem entre tema claro e escuro. Quando desativado, o seletor fica oculto para todos.
                </p>
              </div>
              <Switch
                id="theme-toggle"
                checked={themeToggleVisible}
                onCheckedChange={handleToggleTheme}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}