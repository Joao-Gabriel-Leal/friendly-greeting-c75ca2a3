import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Clock, CheckCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface TimeSelectorProps {
  professionalId: string;
  professionalName: string;
  specialtyId: string;
  specialty: string;
  date: Date;
  onComplete: () => void;
  onBack: () => void;
}

// Generate time slots between start and end time
function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  return slots;
}

export default function TimeSelector({ professionalId, professionalName, specialtyId, specialty, date, onComplete, onBack }: TimeSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dateStr = useMemo(() => format(date, 'yyyy-MM-dd'), [date]);

  useEffect(() => {
    fetchAvailability();
  }, [dateStr, professionalId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);

      // Buscar disponibilidade e slots ocupados em paralelo
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

      // Processar disponibilidade
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

      // Remove duplicatas e ordena
      timeSlots = [...new Set(timeSlots)].sort();
      setAvailableTimeSlots(timeSlots);

      // Processar slots ocupados
      if (bookedResult.data?.bookedSlots) {
        setBookedSlots(bookedResult.data.bookedSlots);
      } else {
        setBookedSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableTimeSlots([]);
      setBookedSlots([]);
    }
    setLoading(false);
  };

  const handleBook = async () => {
    if (!selectedTime || !user) return;

    setBooking(true);

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
        description: `${specialty} em ${format(date, "dd/MM", { locale: ptBR })} às ${selectedTime}`,
      });
      onComplete();
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Horário indisponível',
          description: 'Este horário acabou de ser reservado. Por favor, escolha outro.',
        });
        fetchAvailability();
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
    const isSlotPast = (slot: string): boolean => {
      if (!isToday(date)) return false;
      const now = new Date();
      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = new Date();
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime <= now;
    };

    return availableTimeSlots.filter(slot => !isSlotPast(slot));
  }, [availableTimeSlots, date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Selecione o Horário</CardTitle>
          <CardDescription>
            {specialty} - {format(date, "dd 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displaySlots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Não há horários disponíveis nesta data.
              </p>
              <Button variant="outline" onClick={onBack} className="mt-4">
                Escolher outra data
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {displaySlots.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const isUnavailable = isBooked;
                  const isSelected = selectedTime === slot;

                  return (
                    <Button
                      key={slot}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`h-14 flex flex-col gap-0.5 ${isSelected ? 'gradient-primary' : ''} ${
                        isUnavailable ? 'opacity-50 cursor-not-allowed bg-muted border-muted text-muted-foreground' : ''
                      }`}
                      disabled={isUnavailable}
                      onClick={() => !isUnavailable && setSelectedTime(slot)}
                    >
                      {isBooked ? (
                        <>
                          <span className="text-lg">{slot}</span>
                          <span className="text-xs font-normal">Reservado</span>
                        </>
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
                  className="w-full mt-6 gradient-primary h-12"
                  disabled={booking}
                >
                  {booking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
