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
): Promise<T> {
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
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw error;
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
    
    if (response?.token) {
      localStorage.setItem('auth_token', response.token);
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

  getByUser: async (userId: number) => {
    return fetchApi<any[]>(`/appointments/user/${userId}`);
  },

  getByProfessional: async (professionalId: number) => {
    return fetchApi<any[]>(`/appointments/professional/${professionalId}`);
  },

  checkExisting: async (userId: number, specialtyId: number, startDate: string, endDate: string) => {
    const params = new URLSearchParams({
      user_id: String(userId),
      specialty_id: String(specialtyId),
      start_date: startDate,
      end_date: endDate
    });
    return fetchApi<any[]>(`/appointments/check-existing?${params.toString()}`);
  },

  create: async (data: {
    user_id: number;
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
    professional_confirmed_at: string;
    user_confirmed: boolean;
    user_confirmed_at: string;
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
    return fetchApi<{ bookedSlots: string[] }>(`/appointments/booked-slots?professional_id=${professionalId}&date=${date}`);
  },
};

// ==================== PROFESSIONALS ====================
export const professionalsApi = {
  list: async (activeOnly = true) => {
    return fetchApi<any[]>(`/professionals${activeOnly ? '?active=true' : ''}`);
  },

  getAll: async () => {
    return fetchApi<any[]>('/professionals');
  },

  getById: async (id: number) => {
    return fetchApi<any>(`/professionals/${id}`);
  },

  getByUserId: async (userId: number) => {
    return fetchApi<any>(`/professionals/user/${userId}`);
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

  getAll: async () => {
    return fetchApi<any[]>('/specialties');
  },

  getById: async (id: number) => {
    return fetchApi<any>(`/specialties/${id}`);
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
  getAvailableDays: async (professionalId: number) => {
    return fetchApi<any[]>(`/availability/professional/${professionalId}/days`);
  },

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

  getBlockedDays: async (professionalId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (professionalId) params.append('professional_id', String(professionalId));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
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

  getBookedSlots: async (professionalId: number, date: string) => {
    return fetchApi<{ bookedSlots: string[] }>(`/availability/booked-slots?professional_id=${professionalId}&date=${date}`);
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
    return fetchApi<any>(`/profiles/${id}`);
  },

  getByUserId: async (userId: number) => {
    return fetchApi<any>(`/profiles/user/${userId}`);
  },

  getByUserIds: async (userIds: number[]) => {
    const params = new URLSearchParams();
    userIds.forEach(id => params.append('user_ids', String(id)));
    return fetchApi<any[]>(`/profiles/by-users?${params.toString()}`);
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

// ==================== SPECIALTY BLOCKS ====================
export const specialtyBlocksApi = {
  getByUser: async (userId: number) => {
    return fetchApi<any[]>(`/specialty-blocks/user/${userId}`);
  },

  create: async (data: {
    user_id: number;
    specialty_id: number;
    blocked_until?: string;
    reason?: string;
  }) => {
    return fetchApi('/specialty-blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number) => {
    return fetchApi(`/specialty-blocks/${id}`, {
      method: 'DELETE',
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
  specialtyBlocks: specialtyBlocksApi,
  settings: settingsApi,
};

export default api;
