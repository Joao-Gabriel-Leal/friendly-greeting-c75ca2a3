import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useAppData } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Ban } from 'lucide-react';
import { getSpecialtyIcon, getSpecialtyColor } from '@/lib/specialtyIcons';

interface SpecialtyWithProfessionals {
  id: string;
  name: string;
  professionals: { id: string; name: string }[];
  isBlocked?: boolean;
}

interface SpecialtySelectorProps {
  onSelect: (specialty: string, specialtyId: string, professionalId: string, professionalName: string) => void;
  onBack: () => void;
}

export default function SpecialtySelector({ onSelect, onBack }: SpecialtySelectorProps) {
  const { user } = useAuth();
  const { specialties, getSpecialtyProfessionals, loading: dataLoading } = useAppData();
  const [specialtiesWithProfs, setSpecialtiesWithProfs] = useState<SpecialtyWithProfessionals[]>([]);
  const [blockedSpecialtyIds, setBlockedSpecialtyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedSpecialties();
  }, [user]);

  useEffect(() => {
    if (!dataLoading && specialties.length > 0) {
      buildSpecialtiesList();
    }
  }, [dataLoading, specialties, blockedSpecialtyIds]);

  const fetchBlockedSpecialties = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: blocks } = await supabase
        .from('user_specialty_blocks')
        .select('specialty_id, blocked_until')
        .eq('user_id', user.id);

      const blocked = (blocks || [])
        .filter(b => !b.blocked_until || new Date(b.blocked_until) > new Date())
        .map(b => b.specialty_id);

      setBlockedSpecialtyIds(blocked);
    } catch (error) {
      console.error('Error fetching blocked specialties:', error);
    }
    setLoading(false);
  };

  const buildSpecialtiesList = () => {
    const result = specialties
      .map(spec => {
        const profs = getSpecialtyProfessionals(spec.id);
        return {
          id: spec.id,
          name: spec.name,
          professionals: profs.map(p => ({ id: p.id, name: p.name })),
          isBlocked: blockedSpecialtyIds.includes(spec.id)
        };
      })
      .filter(s => s.professionals.length > 0);

    setSpecialtiesWithProfs(result);
  };

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Escolha a Especialidade</h2>
        <p className="text-muted-foreground">Selecione o tipo de atendimento desejado</p>
      </div>

      <div className="grid gap-4">
        {specialtiesWithProfs.map((spec) => (
          <Card 
            key={spec.id}
            className={`overflow-hidden transition-all ${
              spec.isBlocked 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
            }`}
            onClick={() => !spec.isBlocked && onSelect(spec.name, spec.id, spec.professionals[0].id, spec.professionals[0].name)}
          >
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className={`w-24 h-24 bg-gradient-to-br ${getSpecialtyColor(spec.name)} flex items-center justify-center text-white`}>
                  {spec.isBlocked ? <Ban className="h-8 w-8" /> : getSpecialtyIcon(spec.name)}
                </div>
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{spec.name}</h3>
                  {spec.isBlocked ? (
                    <p className="text-sm text-destructive mt-1">Especialidade suspensa para você</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {spec.professionals.map(p => p.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
