import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, PenLine } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Appointment {
  id: string;
  specialty_id: string;
  specialty_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  professional_name: string;
  professional_confirmed: boolean;
  user_confirmed: boolean;
}

interface MyAppointmentsProps {
  onBack: () => void;
}

export default function MyAppointments({ onBack }: MyAppointmentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('id, specialty_id, appointment_date, appointment_time, status, professional_id, professional_confirmed, user_confirmed')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });

      if (!appointmentsData) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const specialtyIds = [...new Set(appointmentsData.map(a => a.specialty_id).filter(Boolean))];
      const professionalIds = [...new Set(appointmentsData.map(a => a.professional_id).filter(Boolean))];

      const [specialtiesRes, professionalsRes] = await Promise.all([
        supabase.from('specialties').select('id, name').in('id', specialtyIds),
        supabase.from('professionals').select('id, name').in('id', professionalIds)
      ]);

      const specialtiesMap = new Map(specialtiesRes.data?.map(s => [s.id, s.name]) || []);
      const professionalsMap = new Map(professionalsRes.data?.map(p => [p.id, p.name]) || []);

      const enrichedAppointments = appointmentsData.map(apt => ({
        ...apt,
        specialty_name: specialtiesMap.get(apt.specialty_id) || 'N/A',
        professional_name: professionalsMap.get(apt.professional_id) || 'N/A',
        professional_confirmed: apt.professional_confirmed || false,
        user_confirmed: apt.user_confirmed || false
      }));

      setAppointments(enrichedAppointments);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          user_confirmed: true,
          user_confirmed_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Presença confirmada com sucesso!' });
      fetchAppointments();
    } catch (error) {
      console.error('Error confirming attendance:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível confirmar a presença.' });
    }
  };

  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const handleCancelClick = (id: string, date: string) => {
    const appointmentDate = parseISO(date);
    const isToday = isSameDay(appointmentDate, new Date());

    setCancellingId(id);
    if (isToday) {
      setShowWarning(true);
    } else {
      // Fora das 24h: mostrar confirmação antes de cancelar
      setShowConfirmCancel(true);
    }
  };

  const cancelAppointment = async (id: string, withSuspension: boolean) => {
    const appointment = appointments.find(a => a.id === id);
    
    if (!appointment) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Agendamento não encontrado.',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          notes: withSuspension ? 'Cancelado no dia' : 'Cancelado pelo usuário'
        })
        .eq('id', id);

      if (error) throw error;

      // Apply specialty-specific suspension if cancelled same day
      if (withSuspension && user && appointment.specialty_id) {
        const blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + 60);
        
        await supabase
          .from('user_specialty_blocks')
          .insert({
            user_id: user.id,
            specialty_id: appointment.specialty_id,
            blocked_until: blockedUntil.toISOString(),
            reason: 'Cancelamento no dia do agendamento'
          });
      }

      setCancellingId(null);
      setShowWarning(false);

      toast({
        title: 'Agendamento cancelado',
        description: withSuspension 
          ? `Você foi suspenso da especialidade "${appointment.specialty_name}" por 60 dias devido ao cancelamento no dia.`
          : 'Seu agendamento foi cancelado com sucesso.',
        variant: withSuspension ? 'destructive' : 'default',
      });
      
      fetchAppointments();
      
      if (withSuspension) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar o agendamento.',
      });
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    // Check for fully signed appointments
    if (appointment.status === 'completed' && appointment.professional_confirmed && appointment.user_confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
          <CheckCircle className="h-3 w-3" />
          Assinado
        </span>
      );
    }

    switch (appointment.status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Clock className="h-3 w-3" />
            Agendado
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle className="h-3 w-3" />
            Concluído
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <XCircle className="h-3 w-3" />
            Cancelado
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <AlertTriangle className="h-3 w-3" />
            Falta
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const now = new Date();

  const getAppointmentDateTime = (appointment: Appointment) => {
    const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
    const appointmentDate = parseISO(appointment.appointment_date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  };

  // Appointments pending user confirmation (professional confirmed, user hasn't)
  const pendingConfirmation = appointments
    .filter(a => a.status === 'completed' && a.professional_confirmed && !a.user_confirmed)
    .sort((a, b) => getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime());

  // Agendamentos pendentes de confirmação do profissional (passaram mas ainda não foram confirmados)
  const pendingProfessionalConfirmation = appointments
    .filter(a => {
      if (a.status !== 'scheduled') return false;
      const appointmentDateTime = getAppointmentDateTime(a);
      // Passaram o horário mas ainda não foram confirmados pelo profissional
      return appointmentDateTime <= now;
    })
    .sort((a, b) => getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime());

  const upcomingAppointments = appointments
    .filter(a => {
      if (a.status !== 'scheduled') return false;
      const appointmentDateTime = getAppointmentDateTime(a);
      return appointmentDateTime > now;
    })
    .sort((a, b) => getAppointmentDateTime(a).getTime() - getAppointmentDateTime(b).getTime());

  const pastAppointments = appointments
    .filter(a => {
      // Exclude pending confirmations from history
      if (a.status === 'completed' && a.professional_confirmed && !a.user_confirmed) return false;
      // Exclude scheduled appointments that passed but awaiting professional confirmation
      if (a.status === 'scheduled') return false;
      // Only show completed (with both confirmations), cancelled, or no_show
      return ['completed', 'cancelled', 'no_show'].includes(a.status);
    })
    .sort((a, b) => getAppointmentDateTime(b).getTime() - getAppointmentDateTime(a).getTime());

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Meus Agendamentos</h2>
        <p className="text-muted-foreground">Gerencie suas consultas</p>
      </div>

      {/* Pending Confirmations Section */}
      {pendingConfirmation.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <PenLine className="h-5 w-5 text-warning" />
            Aguardando sua Assinatura
          </h3>
          <div className="space-y-4">
            {pendingConfirmation.map(appointment => (
              <Card key={appointment.id} className="overflow-hidden border-warning/50 bg-warning/5">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-20 bg-warning flex flex-col items-center justify-center text-warning-foreground p-4">
                      <span className="text-2xl font-bold">
                        {format(parseISO(appointment.appointment_date), 'dd')}
                      </span>
                      <span className="text-xs uppercase">
                        {format(parseISO(appointment.appointment_date), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{appointment.specialty_name}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.professional_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {appointment.appointment_time.substring(0, 5)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            <PenLine className="h-3 w-3" />
                            Pendente
                          </span>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConfirmAttendance(appointment.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Assinar Presença
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Professional Confirmation Section */}
      {pendingProfessionalConfirmation.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Aguardando Confirmação do Profissional
          </h3>
          <div className="space-y-4">
            {pendingProfessionalConfirmation.map(appointment => (
              <Card key={appointment.id} className="overflow-hidden border-muted bg-muted/10">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-20 bg-muted flex flex-col items-center justify-center text-muted-foreground p-4">
                      <span className="text-2xl font-bold">
                        {format(parseISO(appointment.appointment_date), 'dd')}
                      </span>
                      <span className="text-xs uppercase">
                        {format(parseISO(appointment.appointment_date), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{appointment.specialty_name}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.professional_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {appointment.appointment_time.substring(0, 5)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Aguardando profissional
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcomingAppointments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Próximos</h3>
          <div className="space-y-4">
            {upcomingAppointments.map(appointment => (
              <Card key={appointment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-20 gradient-primary flex flex-col items-center justify-center text-primary-foreground p-4">
                      <span className="text-2xl font-bold">
                        {format(parseISO(appointment.appointment_date), 'dd')}
                      </span>
                      <span className="text-xs uppercase">
                        {format(parseISO(appointment.appointment_date), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{appointment.specialty_name}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.professional_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {appointment.appointment_time.substring(0, 5)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(appointment)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelClick(appointment.id, appointment.appointment_date)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Histórico</h3>
          <div className="space-y-3">
            {pastAppointments.map(appointment => (
              <Card key={appointment.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{appointment.specialty_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(appointment.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às {appointment.appointment_time.substring(0, 5)}
                      </p>
                    </div>
                    {getStatusBadge(appointment)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não possui agendamentos.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmação para cancelamento no dia (com suspensão) */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cancelar no dia da consulta resultará em <strong>suspensão de 60 dias nesta especialidade</strong>.
              Você ainda poderá agendar em outras especialidades. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter agendamento</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancellingId && cancelAppointment(cancellingId, true)}
            >
              Sim, cancelar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação simples para cancelamento normal */}
      <AlertDialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellingId(null)}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancellingId) {
                  cancelAppointment(cancellingId, false);
                  setShowConfirmCancel(false);
                }
              }}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
