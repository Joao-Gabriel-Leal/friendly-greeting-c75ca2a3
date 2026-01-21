import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarCheck, Trash2, Clock, CalendarDays, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Professional {
  id: string;
  name: string;
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

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

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
    }
  };

  const fetchSpecificDates = async () => {
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
      await supabase
        .from('available_days')
        .delete()
        .eq('professional_id', selectedProfessional);

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
        title: 'Sucesso!', 
        description: enabledCount > 0 
          ? `${enabledCount} dia(s) da semana configurado(s).` 
          : 'Disponibilidade semanal limpa.'
      });
      fetchAvailableDays();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar.' });
    }

    setSaving(false);
  };

  const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    
    return s1 < e2 && s2 < e1;
  };

  const handleAddSpecificDate = async () => {
    if (!selectedCalendarDate) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma data.' });
      return;
    }

    const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
    
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
      
      toast({ title: 'Sucesso!', description: 'Horário adicionado.' });
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
      toast({ title: 'Sucesso!', description: 'Horário removido.' });
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

  const setWorkWeekDefaults = () => {
    setSelectedDays({
      0: { enabled: false, start: '09:00', end: '17:00' },
      1: { enabled: true, start: '09:00', end: '17:00' },
      2: { enabled: true, start: '09:00', end: '17:00' },
      3: { enabled: true, start: '09:00', end: '17:00' },
      4: { enabled: true, start: '09:00', end: '17:00' },
      5: { enabled: true, start: '09:00', end: '17:00' },
      6: { enabled: false, start: '09:00', end: '17:00' },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const enabledDaysCount = Object.values(selectedDays).filter(d => d.enabled).length;
  const selectedProfessionalName = professionals.find(p => p.id === selectedProfessional)?.name;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Configurar Disponibilidade
          </CardTitle>
          <CardDescription>
            Configure os dias e horários de trabalho do profissional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Professional Selector */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Label className="text-sm font-medium min-w-fit">Profissional:</Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="max-w-xs">
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
                Agenda Semanal
              </TabsTrigger>
              <TabsTrigger value="specific" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Datas Extras
              </TabsTrigger>
            </TabsList>

            {/* Weekly Schedule Tab */}
            <TabsContent value="weekly" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Ative os dias e configure os horários de atendimento de <strong>{selectedProfessionalName}</strong>
                  </p>
                  <Button variant="outline" size="sm" onClick={setWorkWeekDefaults}>
                    Seg-Sex (9h-17h)
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {dayNames.map((name, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        selectedDays[index].enabled 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <Switch
                        checked={selectedDays[index].enabled}
                        onCheckedChange={() => toggleDay(index)}
                      />
                      
                      <span className={`min-w-32 font-medium ${
                        selectedDays[index].enabled ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {name}
                      </span>
                      
                      {selectedDays[index].enabled && (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={selectedDays[index].start}
                            onChange={(e) => updateDayTime(index, 'start', e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">até</span>
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
                    <span className="font-medium text-foreground">{enabledDaysCount}</span> dia(s) ativo(s)
                  </div>
                  <Button onClick={handleSaveWeekly} className="gradient-primary gap-2" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Agenda
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Specific Dates Tab */}
            <TabsContent value="specific" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Adicione datas extras (feriados trabalhados, plantões, etc.)
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
                    <Card className="bg-primary/5 border-primary/30">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(selectedCalendarDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={specificStartTime}
                            onChange={(e) => setSpecificStartTime(e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={specificEndTime}
                            onChange={(e) => setSpecificEndTime(e.target.value)}
                            className="w-28"
                          />
                        </div>
                        <Button onClick={handleAddSpecificDate} className="w-full gradient-primary gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Data
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium">Datas extras configuradas:</p>
                  
                  {specificDates.length === 0 ? (
                    <Card className="bg-muted/30">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma data extra adicionada</p>
                        <p className="text-sm mt-1">Selecione uma data no calendário</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {specificDates
                        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                        .map(d => (
                          <div 
                            key={`${d.date}-${d.start_time}-${d.end_time}`} 
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                  {format(new Date(d.date + 'T12:00:00'), 'dd')}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {format(new Date(d.date + 'T12:00:00'), "EEEE", { locale: ptBR })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(d.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })} • {d.start_time} - {d.end_time}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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