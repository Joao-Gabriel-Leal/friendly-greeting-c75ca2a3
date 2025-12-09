import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, ArrowLeft } from 'lucide-react';
import SpecialtySelector from '@/components/user/SpecialtySelector';
import DateSelector from '@/components/user/DateSelector';
import TimeSelector from '@/components/user/TimeSelector';
import MyAppointments from '@/components/user/MyAppointments';

type Step = 'home' | 'specialty' | 'date' | 'time' | 'appointments';

export default function AdminMyBooking() {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('home');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedProfessionalName, setSelectedProfessionalName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleSpecialtySelect = (specialty: string, specialtyId: string, professionalId: string, professionalName: string) => {
    setSelectedSpecialty(specialty);
    setSelectedSpecialtyId(specialtyId);
    setSelectedProfessional(professionalId);
    setSelectedProfessionalName(professionalName);
    setStep('date');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleBack = () => {
    if (step === 'date') {
      setStep('specialty');
      setSelectedSpecialty(null);
      setSelectedSpecialtyId(null);
      setSelectedProfessional(null);
      setSelectedProfessionalName(null);
    } else if (step === 'time') {
      setStep('date');
      setSelectedDate(null);
    } else {
      setStep('home');
    }
  };

  const handleComplete = () => {
    setStep('appointments');
    setSelectedSpecialty(null);
    setSelectedSpecialtyId(null);
    setSelectedProfessional(null);
    setSelectedProfessionalName(null);
    setSelectedDate(null);
  };

  return (
    <div className="animate-fade-in">
      {step === 'home' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2">Olá, {profile?.name}!</h2>
            <p className="text-muted-foreground">Agende seu horário como colaborador</p>
          </div>

          <div className="grid gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => setStep('specialty')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Novo Agendamento</h3>
                  <p className="text-sm text-muted-foreground">Agende uma consulta para você</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => setStep('appointments')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <User className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Meus Agendamentos</h3>
                  <p className="text-sm text-muted-foreground">Ver e gerenciar suas consultas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-secondary/30 border-secondary">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-2">Regras importantes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Apenas 1 agendamento por mês por especialidade</li>
                <li>• Horários disponíveis: 09h às 17h</li>
                <li>• Cancelar no dia da consulta gera suspensão de 60 dias</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'specialty' && (
        <SpecialtySelector onSelect={handleSpecialtySelect} onBack={handleBack} />
      )}

      {step === 'date' && selectedProfessional && selectedSpecialtyId && (
        <DateSelector 
          professionalId={selectedProfessional}
          specialtyId={selectedSpecialtyId}
          specialty={selectedSpecialty!}
          onSelect={handleDateSelect}
          onBack={handleBack}
        />
      )}

      {step === 'time' && selectedProfessional && selectedDate && selectedSpecialtyId && (
        <TimeSelector
          professionalId={selectedProfessional}
          professionalName={selectedProfessionalName!}
          specialtyId={selectedSpecialtyId}
          specialty={selectedSpecialty!}
          date={selectedDate}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}

      {step === 'appointments' && (
        <MyAppointments onBack={() => setStep('home')} />
      )}
    </div>
  );
}
