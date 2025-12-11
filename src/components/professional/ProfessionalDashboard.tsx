import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { ConditionalThemeToggle } from '@/components/ConditionalThemeToggle';
import { Loader2, LogOut, CalendarDays, List, XCircle, Clock, CheckCircle, UserCheck, UserX } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/lib/emailService';

interface Appointment {
  id: string;
  user_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  specialty_name: string;
  user_name: string;
  user_email: string;
  professional_confirmed: boolean;
  user_confirmed: boolean;
}

interface Professional {
  id: string;
  name: string;
}

export default function ProfessionalDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfessionalData();
    }
  }, [user]);

  const fetchProfessionalData = async () => {
    if (!user) return;

    // Get professional linked to this user
    const { data: profData, error: profError } = await supabase
      .from('professionals')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !profData) {
      console.error('Error fetching professional:', profError);
      setLoading(false);
      return;
    }

    setProfessional(profData);
    await fetchAppointments(profData.id);
    setLoading(false);
  };

  const fetchAppointments = async (professionalId: string) => {
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('id, user_id, appointment_date, appointment_time, status, specialty_id, professional_confirmed, user_confirmed')
      .eq('professional_id', professionalId)
      .in('status', ['scheduled', 'completed'])
      .order('appointment_date', { ascending: true });

    if (!appointmentsData) return;

    // Get user info and specialty names
    const userIds = [...new Set(appointmentsData.map(a => a.user_id))];
    const specialtyIds = [...new Set(appointmentsData.map(a => a.specialty_id).filter(Boolean))];

    const [profilesRes, specialtiesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, name, email').in('user_id', userIds),
      supabase.from('specialties').select('id, name').in('id', specialtyIds)
    ]);

    const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const specialtiesMap = new Map(specialtiesRes.data?.map(s => [s.id, s.name]) || []);

    const enrichedAppointments: Appointment[] = appointmentsData.map(a => ({
      id: a.id,
      user_id: a.user_id,
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      status: a.status,
      specialty_name: specialtiesMap.get(a.specialty_id) || 'N/A',
      user_name: profilesMap.get(a.user_id)?.name || 'N/A',
      user_email: profilesMap.get(a.user_id)?.email || 'N/A',
      professional_confirmed: a.professional_confirmed || false,
      user_confirmed: a.user_confirmed || false
    }));

    setAppointments(enrichedAppointments);
  };

  const handleOpenCancelDialog = (appointment: Appointment) => {
    setCancelingAppointment(appointment);
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelingAppointment || !professional) return;

    setCanceling(true);

    try {
      // Update appointment status
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', cancelingAppointment.id);

      if (error) throw error;

      // Send cancellation email to user
      await emailService.sendCancellationEmail({
        userEmail: cancelingAppointment.user_email,
        userName: cancelingAppointment.user_name,
        appointmentDate: cancelingAppointment.appointment_date,
        appointmentTime: cancelingAppointment.appointment_time,
        specialty: cancelingAppointment.specialty_name,
        reason: cancelReason || 'Cancelado pelo profissional',
        cancelledBy: 'professional'
      });

      // Get all admins and send notification
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles) {
        const adminIds = adminRoles.map(r => r.user_id);
        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('email, name')
          .in('user_id', adminIds);

        // Send email to each admin
        for (const admin of adminProfiles || []) {
          await emailService.sendCancellationEmail({
            userEmail: admin.email,
            userName: admin.name,
            appointmentDate: cancelingAppointment.appointment_date,
            appointmentTime: cancelingAppointment.appointment_time,
            specialty: cancelingAppointment.specialty_name,
            reason: `Cancelado pelo profissional ${professional.name}. Motivo: ${cancelReason || 'Não informado'}`,
            cancelledBy: 'professional'
          });
        }
      }

      toast({ title: 'Sucesso', description: 'Agendamento cancelado e notificações enviadas.' });
      setShowCancelDialog(false);
      fetchAppointments(professional.id);
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível cancelar o agendamento.' });
    }

    setCanceling(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleConfirmAttendance = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          professional_confirmed: true,
          professional_confirmed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Presença confirmada. Aguardando confirmação do colaborador.' });
      if (professional) fetchAppointments(professional.id);
    } catch (error) {
      console.error('Error confirming attendance:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível confirmar a presença.' });
    }
  };

  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({ title: 'Registrado', description: 'Falta registrada com sucesso.' });
      if (professional) fetchAppointments(professional.id);
    } catch (error) {
      console.error('Error marking no-show:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar a falta.' });
    }
  };

  const isAppointmentPast = (apt: Appointment) => {
    const [hours, minutes] = apt.appointment_time.split(':').map(Number);
    const appointmentDate = parseISO(apt.appointment_date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate < new Date();
  };

  const appointmentsForDate = appointments.filter(a => 
    isSameDay(parseISO(a.appointment_date), selectedDate)
  );

  const datesWithAppointments = appointments.map(a => parseISO(a.appointment_date));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Sua conta de profissional não está configurada corretamente.
            </p>
            <Button onClick={handleSignOut}>Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
  {/* Header */}
  <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      {/* Grupo: ícone + texto */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <img 
            src="/anadem-icon.png" 
            alt="Anadem" 
            className="h-8 w-8"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Painel do Profissional</h1>
          <p className="text-sm text-muted-foreground">Olá, {professional.name}</p>
        </div>
      </div>

      {/* Botão de sair */}
      <div className="flex items-center gap-2">
        <ConditionalThemeToggle />
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Calendário de Agendamentos</CardTitle>
                  <CardDescription>Selecione uma data para ver os agendamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-md border"
                    modifiers={{
                      hasAppointment: datesWithAppointments
                    }}
                    modifiersStyles={{
                      hasAppointment: {
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Agendamentos - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsForDate.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum agendamento nesta data.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointmentsForDate
                        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                        .map(apt => {
                          const isPast = isAppointmentPast(apt);
                          const needsConfirmation = isPast && apt.status === 'scheduled';
                          const awaitingUserConfirmation = apt.professional_confirmed && !apt.user_confirmed;
                          
                          return (
                            <div 
                              key={apt.id} 
                              className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            >
                              <div>
                                <p className="font-medium">{apt.user_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {apt.appointment_time.substring(0, 5)} - {apt.specialty_name}
                                </p>
                                {awaitingUserConfirmation && (
                                  <p className="text-xs text-warning mt-1">Aguardando assinatura do colaborador</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {apt.status === 'completed' && apt.professional_confirmed && apt.user_confirmed ? (
                                  <span className="text-success flex items-center gap-1 text-sm">
                                    <CheckCircle className="h-4 w-4" /> Assinado
                                  </span>
                                ) : apt.status === 'completed' && apt.professional_confirmed ? (
                                  <span className="text-warning flex items-center gap-1 text-sm">
                                    <Clock className="h-4 w-4" /> Aguardando
                                  </span>
                                ) : needsConfirmation ? (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleConfirmAttendance(apt.id)}
                                    >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Compareceu
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleMarkNoShow(apt.id)}
                                    >
                                      <UserX className="h-4 w-4 mr-1" />
                                      Faltou
                                    </Button>
                                  </div>
                                ) : apt.status === 'scheduled' ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleOpenCancelDialog(apt)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Agendamentos</CardTitle>
                <CardDescription>Lista completa de agendamentos futuros</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map(apt => {
                      const isPast = isAppointmentPast(apt);
                      const needsConfirmation = isPast && apt.status === 'scheduled';
                      const awaitingUserConfirmation = apt.professional_confirmed && !apt.user_confirmed;
                      
                      return (
                        <TableRow key={apt.id}>
                          <TableCell>{format(parseISO(apt.appointment_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{apt.appointment_time.substring(0, 5)}</TableCell>
                          <TableCell className="font-medium">{apt.user_name}</TableCell>
                          <TableCell>{apt.specialty_name}</TableCell>
                          <TableCell>
                            {apt.status === 'completed' && apt.professional_confirmed && apt.user_confirmed ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                Assinado
                              </span>
                            ) : apt.status === 'completed' && apt.professional_confirmed ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                Aguardando assinatura
                              </span>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                apt.status === 'completed' 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {apt.status === 'completed' ? 'Concluído' : 'Agendado'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {needsConfirmation ? (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleConfirmAttendance(apt.id)}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Compareceu
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleMarkNoShow(apt.id)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Faltou
                                </Button>
                              </div>
                            ) : apt.status === 'scheduled' ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleOpenCancelDialog(apt)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Ao cancelar, o colaborador {cancelingAppointment?.user_name} e todos os administradores serão notificados por e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Data:</strong> {cancelingAppointment && format(parseISO(cancelingAppointment.appointment_date), 'dd/MM/yyyy')}
              </p>
              <p className="text-sm">
                <strong>Horário:</strong> {cancelingAppointment?.appointment_time.substring(0, 5)}
              </p>
              <p className="text-sm">
                <strong>Colaborador:</strong> {cancelingAppointment?.user_name}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo do cancelamento <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Informe o motivo do cancelamento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelAppointment} disabled={canceling || !cancelReason.trim()}>
              {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
