import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
}

interface Specialty {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  active: boolean;
}

interface ProfessionalSpecialty {
  professional_id: string;
  specialty_id: string;
  professional: Professional;
}

interface AppDataContextType {
  professionals: Professional[];
  specialties: Specialty[];
  professionalSpecialties: ProfessionalSpecialty[];
  loading: boolean;
  refresh: () => Promise<void>;
  getSpecialtyProfessionals: (specialtyId: string) => Professional[];
  getProfessionalSpecialties: (professionalId: string) => Specialty[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [professionalSpecialties, setProfessionalSpecialties] = useState<ProfessionalSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    // Cache de 5 minutos
    const now = Date.now();
    if (!force && lastFetch > 0 && now - lastFetch < 5 * 60 * 1000) {
      return;
    }

    try {
      setLoading(true);
      
      // Buscar tudo em paralelo
      const [profsResult, specsResult, profSpecsResult] = await Promise.all([
        supabase
          .from('professionals')
          .select('id, name, email, phone, active')
          .eq('active', true),
        supabase
          .from('specialties')
          .select('id, name, description, duration_minutes, active')
          .eq('active', true),
        supabase
          .from('professional_specialties')
          .select('professional_id, specialty_id, professionals (id, name, email, phone, active)')
      ]);

      if (profsResult.data) setProfessionals(profsResult.data);
      if (specsResult.data) setSpecialties(specsResult.data);
      if (profSpecsResult.data) {
        setProfessionalSpecialties(
          profSpecsResult.data.map(ps => ({
            professional_id: ps.professional_id,
            specialty_id: ps.specialty_id,
            professional: ps.professionals as unknown as Professional
          }))
        );
      }

      setLastFetch(now);
    } catch (error) {
      console.error('Error fetching app data:', error);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const getSpecialtyProfessionals = useCallback((specialtyId: string): Professional[] => {
    return professionalSpecialties
      .filter(ps => ps.specialty_id === specialtyId && ps.professional?.active)
      .map(ps => ps.professional)
      .filter(Boolean);
  }, [professionalSpecialties]);

  const getProfessionalSpecialties = useCallback((professionalId: string): Specialty[] => {
    const specIds = professionalSpecialties
      .filter(ps => ps.professional_id === professionalId)
      .map(ps => ps.specialty_id);
    return specialties.filter(s => specIds.includes(s.id) && s.active);
  }, [professionalSpecialties, specialties]);

  return (
    <AppDataContext.Provider value={{
      professionals,
      specialties,
      professionalSpecialties,
      loading,
      refresh,
      getSpecialtyProfessionals,
      getProfessionalSpecialties
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
