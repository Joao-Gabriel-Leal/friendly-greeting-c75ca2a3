import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarCheck, Trash2, Clock, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Professional {
  id: string;
  name: string;
}

interface AvailableDay {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface SpecificDate {
  date: string;
  start_time: string;
  end_time: string;
}

export default function AdminAvailableDays() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [selectedDays, setSelectedDays] = useState<{ [key: number]: { enabled: boolean; start: string; end: string } }>({
    0: { enabled: false, start: '09:00', end: '17:00' },
    1: { enabled: false, start: '09:00', end: '17:00' },
    2: { enabled: false, start: '09:00', end: '17:00' },
    3: { enabled: false, start: '09:00', end: '17:00' },
    4: { enabled: false, start: '09:00', end: '17:00' },
    5: { enabled: false, start: '09:00', end: '17:00' },
    6: { enabled: false, start: '09:00', end: '17:00' },
  });
  const [specificDates, setSpecificDates] = useState<SpecificDate[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [specificStartTime, setSpecificStartTime] = useState('09:00');
  const [specificEndTime, setSpecificEndTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional) {
      fetchAvailableDays();
      fetchSpecificDates();
    }
  }, [selectedProfessional]);

  const fetchProfessionals = async () => {
    const { data, error } = await supabase.from('professionals').select('id, name');
    if (data && !error) {
      setProfessionals(data);
      if (data.length > 0) {
        setSelectedProfessional(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchAvailableDays = async () => {
    const { data, error } = await supabase
      .from('available_days')
      .select('*')
      .eq('professional_id', selectedProfessional);

    if (data && !error) {
      const daysConfig: { [key: number]: { enabled: boolean; start: string; end: string } } = {
        0: { enabled: false, start: '09:00', end: '17:00' },
        1: { enabled: false, start: '09:00', end: '17:00' },
        2: { enabled: false, start: '09:00', end: '17:00' },
        3: { enabled: false, start: '09:00', end: '17:00' },
        4: { enabled: false, start: '09:00', end: '17:00' },
        5: { enabled: false, start: '09:00', end: '17:00' },
        6: { enabled: false, start: '09:00', end: '17:00' },
      };

      data.forEach(d => {
        daysConfig[d.day_of_week] = {
          enabled: true,
          start: d.start_time.substring(0, 5),
          end: d.end_time.substring(0, 5)
        };
      });

      setSelectedDays(daysConfig);
      setAvailableDays(data);
    } else {
      setSelectedDays({
        0: { enabled: false, start: '09:00', end: '17:00' },
        1: { enabled: false, start: '09:00', end: '17:00' },
        2: { enabled: false, start: '09:00', end: '17:00' },
        3: { enabled: false, start: '09:00', end: '17:00' },
        4: { enabled: false, start: '09:00', end: '17:00' },
        5: { enabled: false, start: '09:00', end: '17:00' },
        6: { enabled: false, start: '09:00', end: '17:00' },
      });
      setAvailableDays([]);
    }
  };

  const fetchSpecificDates = async () => {
    // Fetch from blocked_days with reason starting with "AVAILABLE:" to store specific available dates
    const { data } = await supabase
      .from('blocked_days')
      .select('blocked_date, reason')
      .eq('professional_id', selectedProfessional)
      .like('reason', 'AVAILABLE:%');

    if (data) {
      const dates = data.map(d => {
        const parts = d.reason?.replace('AVAILABLE:', '').split('-') || ['09:00', '17:00'];
        return {
          date: d.blocked_date,
          start_time: parts[0] || '09:00',
          end_time: parts[1] || '17:00'
        };
      });
      setSpecificDates(dates);
    }
  };

  const handleSaveWeekly = async () => {
    setSaving(true);

    try {
      // Delete existing available days for this professional
      await supabase
        .from('available_days')
        .delete()
        .eq('professional_id', selectedProfessional);

      // Insert new available days with times
      const inserts = Object.entries(selectedDays)
        .filter(([_, config]) => config.enabled)
        .map(([day, config]) => ({
          professional_id: selectedProfessional,
          day_of_week: parseInt(day),
          start_time: config.start + ':00',
          end_time: config.end + ':00'
        }));

      if (inserts.length > 0) {
        const { error } = await supabase.from('available_days').insert(inserts);
        if (error) throw error;
      }

      const enabledCount = Object.values(selectedDays).filter(d => d.enabled).length;
      toast({ 
        title: 'Sucesso', 
        description: enabledCount > 0 
          ? `${enabledCount} dias da semana configurados.` 
          : 'Disponibilidade semanal limpa.'
      });
      fetchAvailableDays();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' });
    }

    setSaving(false);
  };

  // Helper function to check if two time ranges overlap
  const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    
    // Two ranges overlap if one starts before the other ends and vice versa
    return s1 < e2 && s2 < e1;
  };

  const handleAddSpecificDate = async () => {
    if (!selectedCalendarDate) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma data.' });
      return;
    }

    const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
    
    // Check for time overlap with existing entries on the same date
    const overlappingEntry = specificDates.find(d => 
      d.date === dateStr && 
      hasTimeOverlap(specificStartTime, specificEndTime, d.start_time, d.end_time)
    );

    if (overlappingEntry) {
      toast({ 
        variant: 'destructive', 
        title: 'Conflito de horário', 
        description: `Este horário conflita com ${overlappingEntry.start_time} - ${overlappingEntry.end_time}.` 
      });
      return;
    }

    try {
      // Store as blocked_day with special reason format
      const { error } = await supabase.from('blocked_days').insert({
        professional_id: selectedProfessional,
        blocked_date: dateStr,
        reason: `AVAILABLE:${specificStartTime}-${specificEndTime}`
      });

      if (error) throw error;

      setSpecificDates([...specificDates, { 
        date: dateStr, 
        start_time: specificStartTime, 
        end_time: specificEndTime 
      }]);
      
      toast({ title: 'Sucesso', description: 'Horário adicionado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar.' });
    }
  };

  const handleRemoveSpecificDate = async (dateStr: string, startTime: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('blocked_days')
        .delete()
        .eq('professional_id', selectedProfessional)
        .eq('blocked_date', dateStr)
        .eq('reason', `AVAILABLE:${startTime}-${endTime}`);

      if (error) throw error;

      setSpecificDates(specificDates.filter(d => 
        !(d.date === dateStr && d.start_time === startTime && d.end_time === endTime)
      ));
      toast({ title: 'Sucesso', description: 'Horário removido.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover.' });
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateDayTime = (day: number, field: 'start' | 'end', value: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const enabledDaysCount = Object.values(selectedDays).filter(d => d.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Configurar Disponibilidade
          </CardTitle>
          <CardDescription>
            Configure os dias e horários de trabalho do profissional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="weekly" className="gap-2">
                <Clock className="h-4 w-4" />
                Semanal
              </TabsTrigger>
              <TabsTrigger value="specific" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Datas Específicas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-6">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure os dias e horários regulares de trabalho:
                </p>
                
                <div className="space-y-3">
                  {dayNames.map((name, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                      <button
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`min-w-24 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDays[index].enabled
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {dayNamesShort[index]}
                      </button>
                      
                      {selectedDays[index].enabled && (
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-sm text-muted-foreground">Das</Label>
                          <Input
                            type="time"
                            value={selectedDays[index].start}
                            onChange={(e) => updateDayTime(index, 'start', e.target.value)}
                            className="w-28"
                          />
                          <Label className="text-sm text-muted-foreground">às</Label>
                          <Input
                            type="time"
                            value={selectedDays[index].end}
                            onChange={(e) => updateDayTime(index, 'end', e.target.value)}
                            className="w-28"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {enabledDaysCount} dia(s) selecionado(s)
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedDays({
                      0: { enabled: false, start: '09:00', end: '17:00' },
                      1: { enabled: false, start: '09:00', end: '17:00' },
                      2: { enabled: false, start: '09:00', end: '17:00' },
                      3: { enabled: false, start: '09:00', end: '17:00' },
                      4: { enabled: false, start: '09:00', end: '17:00' },
                      5: { enabled: false, start: '09:00', end: '17:00' },
                      6: { enabled: false, start: '09:00', end: '17:00' },
                    })}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button onClick={handleSaveWeekly} className="gradient-primary" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Disponibilidade'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specific" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Adicione datas específicas em que o profissional estará disponível:
                  </p>
                  
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={setSelectedCalendarDate}
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                    disabled={(date) => date < new Date()}
                  />

                  {selectedCalendarDate && (
                    <Card className="bg-secondary/30">
                      <CardContent className="pt-4 space-y-4">
                        <p className="font-medium">
                          {format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Das</Label>
                          <Input
                            type="time"
                            value={specificStartTime}
                            onChange={(e) => setSpecificStartTime(e.target.value)}
                            className="w-28"
                          />
                          <Label className="text-sm">às</Label>
                          <Input
                            type="time"
                            value={specificEndTime}
                            onChange={(e) => setSpecificEndTime(e.target.value)}
                            className="w-28"
                          />
                        </div>
                        <Button onClick={handleAddSpecificDate} className="w-full gradient-primary">
                          Adicionar Data
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium">Datas específicas configuradas:</p>
                  
                  {specificDates.length === 0 ? (
                    <Card className="bg-muted/30">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Nenhuma data específica adicionada.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {specificDates
                        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                        .map(d => (
                          <div 
                            key={`${d.date}-${d.start_time}-${d.end_time}`} 
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div>
                              <p className="font-medium">
                                {format(parseISO(d.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {d.start_time} - {d.end_time}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSpecificDate(d.date, d.start_time, d.end_time)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}