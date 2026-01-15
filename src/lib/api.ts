// API Client para comunicação com o backend local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

// Helper para fazer requisições autenticadas
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Erro na requisição' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Erro de conexão com o servidor' };
  }
}

// ==================== AUTH ====================
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetchApi<{
      token: string;
      user: { id: number; email: string };
      profile: any;
      role: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  },

  register: async (email: string, password: string, name: string, setor: string) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, setor }),
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getProfile: async () => {
    return fetchApi<{
      user: { id: number; email: string };
      profile: any;
      role: string;
    }>('/auth/me');
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return fetchApi('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ==================== APPOINTMENTS ====================
export const appointmentsApi = {
  list: async (filters?: { status?: string; date?: string; professional_id?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.professional_id) params.append('professional_id', String(filters.professional_id));
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<any[]>(`/appointments${query}`);
  },

  getByUser: async () => {
    return fetchApi<any[]>('/appointments/my');
  },

  create: async (data: {
    professional_id: number;
    specialty_id: number;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
  }) => {
    return fetchApi('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    status: string;
    notes: string;
    professional_confirmed: boolean;
    user_confirmed: boolean;
  }>) => {
    return fetchApi(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (id: number) => {
    return fetchApi(`/appointments/${id}/cancel`, {
      method: 'POST',
    });
  },

  getBookedSlots: async (professionalId: number, date: string) => {
    return fetchApi<string[]>(`/appointments/booked-slots?professional_id=${professionalId}&date=${date}`);
  },
};

// ==================== PROFESSIONALS ====================
export const professionalsApi = {
  list: async (activeOnly = true) => {
    return fetchApi<any[]>(`/professionals${activeOnly ? '?active=true' : ''}`);
  },

  getById: async (id: number) => {
    return fetchApi(`/professionals/${id}`);
  },

  create: async (data: {
    name: string;
    email?: string;
    phone?: string;
    specialties?: number[];
  }) => {
    return fetchApi('/professionals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    name: string;
    email: string;
    phone: string;
    active: boolean;
    specialties: number[];
  }>) => {
    return fetchApi(`/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchApi(`/professionals/${id}`, {
      method: 'DELETE',
    });
  },

  getBySpecialty: async (specialtyId: number) => {
    return fetchApi<any[]>(`/professionals/by-specialty/${specialtyId}`);
  },
};

// ==================== SPECIALTIES ====================
export const specialtiesApi = {
  list: async (activeOnly = true) => {
    return fetchApi<any[]>(`/specialties${activeOnly ? '?active=true' : ''}`);
  },

  getById: async (id: number) => {
    return fetchApi(`/specialties/${id}`);
  },

  create: async (data: {
    name: string;
    description?: string;
    duration_minutes?: number;
  }) => {
    return fetchApi('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    name: string;
    description: string;
    duration_minutes: number;
    active: boolean;
  }>) => {
    return fetchApi(`/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchApi(`/specialties/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== AVAILABILITY ====================
export const availabilityApi = {
  getByProfessional: async (professionalId: number) => {
    return fetchApi<any[]>(`/availability/professional/${professionalId}`);
  },

  setAvailableDays: async (professionalId: number, days: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>) => {
    return fetchApi(`/availability/professional/${professionalId}/days`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },

  getBlockedDays: async (professionalId?: number) => {
    const query = professionalId ? `?professional_id=${professionalId}` : '';
    return fetchApi<any[]>(`/availability/blocked${query}`);
  },

  blockDay: async (data: {
    professional_id?: number;
    specialty_id?: number;
    blocked_date: string;
    reason?: string;
  }) => {
    return fetchApi('/availability/blocked', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  unblockDay: async (id: number) => {
    return fetchApi(`/availability/blocked/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailableSlots: async (professionalId: number, date: string, durationMinutes: number) => {
    return fetchApi<string[]>(
      `/availability/slots?professional_id=${professionalId}&date=${date}&duration=${durationMinutes}`
    );
  },
};

// ==================== PROFILES ====================
export const profilesApi = {
  list: async () => {
    return fetchApi<any[]>('/profiles');
  },

  getById: async (id: number) => {
    return fetchApi(`/profiles/${id}`);
  },

  update: async (id: number, data: Partial<{
    name: string;
    phone: string;
    cpf: string;
    setor: string;
    blocked: boolean;
    suspended_until: string | null;
    must_change_password: boolean;
  }>) => {
    return fetchApi(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  blockUser: async (userId: number, blocked: boolean) => {
    return fetchApi(`/profiles/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ blocked }),
    });
  },

  suspendUser: async (userId: number, suspendedUntil: string | null) => {
    return fetchApi(`/profiles/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ suspended_until: suspendedUntil }),
    });
  },
};

// ==================== SETTINGS ====================
export const settingsApi = {
  get: async (key: string) => {
    return fetchApi(`/settings/${key}`);
  },

  getAll: async () => {
    return fetchApi<any[]>('/settings');
  },

  set: async (key: string, value: any) => {
    return fetchApi(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  appointments: appointmentsApi,
  professionals: professionalsApi,
  specialties: specialtiesApi,
  availability: availabilityApi,
  profiles: profilesApi,
  settings: settingsApi,
};

export default api;
