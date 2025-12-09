import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  specialties: string[];
  password_temp: string | null;
  user_id: string | null;
}

interface Specialty {
  id: string;
  name: string;
}

export default function AdminProfessionals() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    selectedSpecialties: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profRes, specRes, profSpecRes] = await Promise.all([
      supabase.from('professionals').select('*').order('name'),
      supabase.from('specialties').select('id, name'),
      supabase.from('professional_specialties').select('professional_id, specialty_id')
    ]);

    const specialtiesMap = new Map(specRes.data?.map(s => [s.id, s.name]) || []);
    
    const professionalsWithSpecialties = (profRes.data || []).map(prof => {
      const profSpecialties = profSpecRes.data
        ?.filter(ps => ps.professional_id === prof.id)
        .map(ps => specialtiesMap.get(ps.specialty_id) || '')
        .filter(Boolean) || [];
      
      return { ...prof, specialties: profSpecialties };
    });

    setProfessionals(professionalsWithSpecialties);
    setSpecialties(specRes.data || []);
    setLoading(false);
  };

  const handleNew = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', password: '', selectedSpecialties: [] });
    setShowPassword(false);
    setShowDialog(true);
  };

  const handleEdit = async (prof: Professional) => {
    setEditingId(prof.id);
    
    const { data } = await supabase
      .from('professional_specialties')
      .select('specialty_id')
      .eq('professional_id', prof.id);
    
    setFormData({
      name: prof.name,
      email: prof.email || '',
      phone: prof.phone || '',
      password: '',
      selectedSpecialties: data?.map(d => d.specialty_id) || []
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome é obrigatório.' });
      return;
    }

    if (!editingId) {
      if (!formData.email.trim()) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Email é obrigatório para criar conta.' });
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Senha deve ter no mínimo 6 caracteres.' });
        return;
      }
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('professionals')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null
          })
          .eq('id', editingId);

        if (error) throw error;

        await supabase
          .from('professional_specialties')
          .delete()
          .eq('professional_id', editingId);

        if (formData.selectedSpecialties.length > 0) {
          await supabase.from('professional_specialties').insert(
            formData.selectedSpecialties.map(specId => ({
              professional_id: editingId,
              specialty_id: specId
            }))
          );
        }

        toast({ title: 'Sucesso', description: 'Profissional atualizado.' });
      } else {
        // Create professional record first
        const { data: newProf, error } = await supabase
          .from('professionals')
          .insert({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            password_temp: formData.password
          })
          .select()
          .single();

        if (error) throw error;

        // Add specialties
        if (formData.selectedSpecialties.length > 0 && newProf) {
          await supabase.from('professional_specialties').insert(
            formData.selectedSpecialties.map(specId => ({
              professional_id: newProf.id,
              specialty_id: specId
            }))
          );
        }

        // Create user account for professional
        if (newProf && formData.email) {
          const response = await supabase.functions.invoke('create-professional-account', {
            body: {
              professionalId: newProf.id,
              email: formData.email,
              password: formData.password,
              name: formData.name
            }
          });

          if (response.error) {
            console.error('Error creating account:', response.error);
            toast({ 
              variant: 'destructive', 
              title: 'Aviso', 
              description: `Profissional criado, mas erro ao criar conta: ${response.error.message}` 
            });
          } else {
            toast({ 
              title: 'Sucesso', 
              description: 'Profissional criado com conta de acesso!' 
            });
          }
        } else {
          toast({ title: 'Sucesso', description: 'Profissional criado.' });
        }
      }
      
      fetchData();
      setShowDialog(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    const { error } = await supabase.from('professionals').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir.' });
    } else {
      toast({ title: 'Sucesso', description: 'Profissional excluído.' });
      fetchData();
    }
  };

  const handleOpenChangePassword = (prof: Professional) => {
    setEditingProfessional(prof);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!editingProfessional?.user_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Profissional não possui conta de usuário.' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    try {
      const response = await supabase.functions.invoke('admin-update-password', {
        body: { userId: editingProfessional.user_id, newPassword },
      });

      if (response.error) {
        toast({ variant: 'destructive', title: 'Erro', description: response.error.message || 'Não foi possível alterar a senha.' });
      } else {
        // Also update password_temp in professionals table
        await supabase
          .from('professionals')
          .update({ password_temp: newPassword })
          .eq('id', editingProfessional.id);

        toast({ title: 'Sucesso', description: 'Senha alterada com sucesso.' });
        setShowPasswordDialog(false);
        setNewPassword('');
        fetchData();
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao alterar a senha. Tente novamente.' });
    }
  };

  const toggleSpecialty = (specId: string) => {
    if (formData.selectedSpecialties.includes(specId)) {
      setFormData({ 
        ...formData, 
        selectedSpecialties: formData.selectedSpecialties.filter(id => id !== specId) 
      });
    } else {
      setFormData({ 
        ...formData, 
        selectedSpecialties: [...formData.selectedSpecialties, specId] 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button onClick={handleNew} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Profissional
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map(prof => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell className="text-muted-foreground">{prof.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {prof.specialties.map(spec => {
                        const colorMap: Record<string, string> = {
                          'Massagem': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
                          'Nutricionista': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                          'Nutrição': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                          'Psicólogo': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                          'Psicologia': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                        };
                        const colorClass = colorMap[spec] || 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
                        return (
                          <span 
                            key={spec} 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                          >
                            {spec}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prof.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {prof.user_id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenChangePassword(prof)}
                          title="Alterar senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(prof)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDelete(prof.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} Profissional</DialogTitle>
            {!editingId && (
              <DialogDescription>
                Preencha os dados abaixo. Uma conta de acesso será criada automaticamente.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do profissional"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nome@empresa.com.br"
                disabled={!!editingId}
              />
              {editingId && (
                <p className="text-xs text-muted-foreground">Email não pode ser alterado após criação.</p>
              )}
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="space-y-2">
                {specialties.map(spec => (
                  <div key={spec.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec.id}`}
                      checked={formData.selectedSpecialties.includes(spec.id)}
                      onCheckedChange={() => toggleSpecialty(spec.id)}
                    />
                    <Label htmlFor={`spec-${spec.id}`} className="cursor-pointer">
                      {spec.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Profissional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Definir nova senha para <strong>{editingProfessional?.name}</strong>:
            </p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} className="gradient-primary">Alterar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}