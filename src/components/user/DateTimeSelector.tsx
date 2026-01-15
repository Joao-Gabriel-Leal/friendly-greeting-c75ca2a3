import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isBrazilianHoliday } from '@/lib/brazilianHolidays';
import { useToast } from '@/hooks/use-toast';

interface DateTimeSelectorProps {
  professionalId: string;
  professionalName: string;
  specialtyId: string;
  specialty: string;
  onComplete: () => void;
  onBack: () => void;
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  return slots;
}

export default function DateTimeSelector({ 
  professionalId, 
  professionalName, 
  specialtyId, 
  specialty, 
  onComplete, 
  onBack 
}: DateTimeSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Calendar state
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [specificAvailableDates, setSpecificAvailableDates] = useState<Date[]>([]);
  const [existingAppointment, setExistingAppointment] = useState<{ id: string; date: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  // Time slots state
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  // Fetch calendar availability on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingCalendar(true);
      await Promise.all([
        fetchCalendarAvailability(),
        checkExistingAppointment()
      ]);
      setLoadingCalendar(false);
    };
    loadData();
  }, [professionalId, specialtyId]);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    } else {
      setAvailableTimeSlots([]);
      setBookedSlots([]);
      setSelectedTime(null);
    }
  }, [selectedDate]);

  const fetchCalendarAvailability = async () => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 30);

    try {
      const { data: availableData } = await supabase
        .from('available_days')
        .select('day_of_week')
        .eq('professional_id', professionalId);

      if (availableData) {
        setAvailableDays(availableData.map(d => d.day_of_week));
      }

      const { data: blockedData } = await supabase
        .from('blocked_days')
        .select('blocked_date, reason')
        .or(`professional_id.eq.${professionalId},professional_id.is.null`)
        .gte('blocked_date', format(today, 'yyyy-MM-dd'))
        .lte('blocked_date', format(maxDate, 'yyyy-MM-dd'));

      if (blockedData) {
        const blocked = blockedData
          .filter(d => !d.reason?.startsWith('AVAILABLE:'))
          .map(d => new Date(d.blocked_date + 'T12:00:00'));
        
        const specificAvailable = blockedData
          .filter(d => d.reason?.startsWith('AVAILABLE:'))
          .map(d => new Date(d.blocked_date + 'T12:00:00'));
        
        setBlockedDates(blocked);
        setSpecificAvailableDates(specificAvailable);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const checkExistingAppointment = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, professional_confirmed, user_confirmed')
        .eq('user_id', user.id)
        .eq('specialty_id', specialtyId)
        .in('status', ['scheduled', 'completed'])
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'));

      if (data && data.length > 0) {
        const blockingAppointment = data.find(apt => {
          if (apt.status === 'scheduled') {
            const aptDate = new Date(apt.appointment_date + 'T' + apt.appointment_time);
            if (aptDate > today) return true;
            return !apt.professional_confirmed;
          }
          if (apt.status === 'completed') {
            return apt.professional_confirmed && apt.user_confirmed;
          }
          return false;
        });

        if (blockingAppointment) {
          setExistingAppointment({ id: blockingAppointment.id, date: blockingAppointment.appointment_date });
        }
      }
    } catch (error) {
      console.error('Error checking existing appointment:', error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      const [availabilityResult, bookedResult] = await Promise.all([
        supabase
          .from('blocked_days')
          .select('reason')
          .eq('professional_id', professionalId)
          .eq('blocked_date', dateStr)
          .like('reason', 'AVAILABLE:%'),
        supabase.functions.invoke('get-booked-slots', {
          body: { professionalId, date: dateStr },
        })
      ]);

      let timeSlots: string[] = [];
      if (availabilityResult.data && availabilityResult.data.length > 0) {
        availabilityResult.data.forEach(entry => {
          if (entry.reason) {
            const match = entry.reason.match(/AVAILABLE:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
            if (match) {
              const [, startTime, endTime] = match;
              const slots = generateTimeSlots(startTime, endTime);
              timeSlots = [...timeSlots, ...slots];
            }
          }
        });
      }

      timeSlots = [...new Set(timeSlots)].sort();
      setAvailableTimeSlots(timeSlots);

      if (bookedResult.data?.bookedSlots) {
        setBookedSlots(bookedResult.data.bookedSlots);
      } else {
        setBookedSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]);
      setBookedSlots([]);
    }
    setLoadingSlots(false);
  };

  const isDateAvailable = (date: Date) => {
    const normalizedDate = startOfDay(date);
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 30);

    if (normalizedDate < today || normalizedDate > maxDate) return false;
    if (blockedDates.some(blocked => isSameDay(blocked, date))) return false;
    if (isBrazilianHoliday(date)) return false;

    if (specificAvailableDates.some(specific => isSameDay(specific, date))) {
      return true;
    }

    const dayOfWeek = date.getDay();
    
    if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
      return false;
    }

    if (availableDays.length === 0 && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false;
    }

    return true;
  };

  const handleBook = async () => {
    if (!selectedTime || !user || !selectedDate) return;

    setBooking(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        professional_id: professionalId,
        specialty_id: specialtyId,
        appointment_date: dateStr,
        appointment_time: selectedTime + ':00',
      });

      if (error) throw error;

      toast({
        title: 'Agendamento confirmado!',
        description: `${specialty} em ${format(selectedDate, "dd/MM", { locale: ptBR })} às ${selectedTime}`,
      });
      onComplete();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Horário indisponível',
          description: 'Este horário acabou de ser reservado. Por favor, escolha outro.',
        });
        fetchTimeSlots();
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao agendar',
          description: 'Não foi possível realizar o agendamento. Tente novamente.',
        });
      }
    }

    setBooking(false);
  };

  const displaySlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const isSlotPast = (slot: string): boolean => {
      if (!isToday(selectedDate)) return false;
      const now = new Date();
      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime <= now;
    };

    return availableTimeSlots.filter(slot => !isSlotPast(slot));
  }, [availableTimeSlots, selectedDate]);

  if (loadingCalendar) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingAppointment) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-warning">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <CardTitle>Limite atingido</CardTitle>
            <CardDescription>
              Você já possui um agendamento de <strong>{specialty}</strong> este mês
              (dia {format(new Date(existingAppointment.date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Para agendar novamente, cancele o agendamento atual ou aguarde o próximo mês.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Selecione Data e Horário</CardTitle>
          <CardDescription>{specialty} com {professionalName} - Próximos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                locale={ptBR}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border pointer-events-auto"
              />
              
              {selectedDate && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Data selecionada: <span className="font-semibold text-foreground">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </p>
              )}
            </div>

            {/* Time Slots */}
            <div className="flex flex-col">
              {!selectedDate ? (
                <div className="flex-1 flex items-center justify-center text-center py-8 border rounded-lg bg-muted/30">
                  <div>
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Selecione uma data para ver os horários disponíveis
                    </p>
                  </div>
                </div>
              ) : loadingSlots ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displaySlots.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center py-8 border rounded-lg bg-muted/30">
                  <div>
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Não há horários disponíveis nesta data.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Selecione outra data no calendário.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-center">Horários disponíveis:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displaySlots.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedTime === slot;

                      return (
                        <Button
                          key={slot}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`h-12 ${isSelected ? 'gradient-primary' : ''} ${
                            isBooked ? 'opacity-50 cursor-not-allowed bg-muted border-muted text-muted-foreground' : ''
                          }`}
                          disabled={isBooked}
                          onClick={() => !isBooked && setSelectedTime(slot)}
                        >
                          {isBooked ? (
                            <span className="text-sm">Reservado</span>
                          ) : (
                            <>
                              {isSelected && <CheckCircle className="h-4 w-4 mr-1" />}
                              <span className="text-lg">{slot}</span>
                            </>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {selectedTime && (
                    <Button
                      onClick={handleBook}
                      className="w-full mt-4 gradient-primary h-12"
                      disabled={booking}
                    >
                      {booking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Confirmar Agendamento'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}