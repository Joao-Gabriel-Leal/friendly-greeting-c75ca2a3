import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';
import SpecialtySelector from '@/components/user/SpecialtySelector';
import DateTimeSelector from '@/components/user/DateTimeSelector';
import MyAppointments from '@/components/user/MyAppointments';

type Step = 'home' | 'specialty' | 'datetime' | 'appointments';

export default function AdminMyBooking() {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('home');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  const [selectedProfessionalName, setSelectedProfessionalName] = useState<string | null>(null);

  const handleSpecialtySelect = (specialty: string, specialtyId: number, professionalId: number, professionalName: string) => {
    setSelectedSpecialty(specialty);
    setSelectedSpecialtyId(specialtyId);
    setSelectedProfessional(professionalId);
    setSelectedProfessionalName(professionalName);
    setStep('datetime');
  };

  const handleBack = () => {
    if (step === 'datetime') {
      setStep('specialty');
      setSelectedSpecialty(null);
      setSelectedSpecialtyId(null);
      setSelectedProfessional(null);
      setSelectedProfessionalName(null);
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

      {step === 'datetime' && selectedProfessional && selectedSpecialtyId && (
        <DateTimeSelector 
          professionalId={selectedProfessional}
          professionalName={selectedProfessionalName!}
          specialtyId={selectedSpecialtyId}
          specialty={selectedSpecialty!}
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
