-- Índices para melhorar performance de consultas

-- Índice para buscar agendamentos por data
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Índice para buscar agendamentos por usuário
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

-- Índice para buscar agendamentos por profissional
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);

-- Índice para buscar agendamentos por status
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Índice composto para consultas de disponibilidade
CREATE INDEX IF NOT EXISTS idx_appointments_professional_date_time ON appointments(professional_id, appointment_date, appointment_time);

-- Índice para buscar disponibilidade por data
CREATE INDEX IF NOT EXISTS idx_blocked_days_date ON blocked_days(blocked_date);

-- Índice para buscar disponibilidade por profissional
CREATE INDEX IF NOT EXISTS idx_blocked_days_professional ON blocked_days(professional_id);

-- Índice composto para consultas de disponibilidade por profissional e data
CREATE INDEX IF NOT EXISTS idx_blocked_days_professional_date ON blocked_days(professional_id, blocked_date);

-- Índice para buscar especialidades de profissionais
CREATE INDEX IF NOT EXISTS idx_professional_specialties_professional ON professional_specialties(professional_id);

-- Índice para buscar profissionais de especialidades
CREATE INDEX IF NOT EXISTS idx_professional_specialties_specialty ON professional_specialties(specialty_id);

-- Índice para buscar perfis por user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Índice para buscar bloqueios de especialidade por usuário
CREATE INDEX IF NOT EXISTS idx_user_specialty_blocks_user ON user_specialty_blocks(user_id);

-- Índice para buscar roles por user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);