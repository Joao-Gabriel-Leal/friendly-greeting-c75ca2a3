import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { professionalsApi, specialtiesApi } from '@/lib/api';

interface Professional {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
}

interface Specialty {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  active: boolean;
}

interface ProfessionalSpecialty {
  professional_id: number;
  specialty_id: number;
  professional: Professional;
}

interface AppDataContextType {
  professionals: Professional[];
  specialties: Specialty[];
  professionalSpecialties: ProfessionalSpecialty[];
  loading: boolean;
  refresh: () => Promise<void>;
  getSpecialtyProfessionals: (specialtyId: number) => Professional[];
  getProfessionalSpecialties: (professionalId: number) => Specialty[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [professionalSpecialties, setProfessionalSpecialties] = useState<ProfessionalSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const hasData = professionals.length > 0 && specialties.length > 0;
    
    if (!force && hasData && lastFetch > 0 && now - lastFetch < 5 * 60 * 1000) {
      return;
    }

    try {
      setLoading(true);
      
      const [profsResult, specsResult] = await Promise.all([
        professionalsApi.list(true),
        specialtiesApi.list(true),
      ]);

      if (profsResult) setProfessionals(profsResult);
      if (specsResult) setSpecialties(specsResult);

      if (profsResult) {
        const profSpecs: ProfessionalSpecialty[] = [];
        profsResult.forEach((prof: any) => {
          if (prof.specialties) {
            prof.specialties.forEach((specId: number) => {
              profSpecs.push({
                professional_id: prof.id,
                specialty_id: specId,
                professional: prof
              });
            });
          }
        });
        setProfessionalSpecialties(profSpecs);
      }

      setLastFetch(now);
    } catch (error) {
      console.error('Error fetching app data:', error);
    } finally {
      setLoading(false);
    }
  }, [professionals.length, specialties.length, lastFetch]);

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = useCallback(async () => {
    setLastFetch(0);
    await fetchData(true);
  }, []);

  const getSpecialtyProfessionals = useCallback((specialtyId: number): Professional[] => {
    return professionalSpecialties
      .filter(ps => ps.specialty_id === specialtyId && ps.professional?.active)
      .map(ps => ps.professional)
      .filter(Boolean);
  }, [professionalSpecialties]);

  const getProfessionalSpecialties = useCallback((professionalId: number): Specialty[] => {
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
