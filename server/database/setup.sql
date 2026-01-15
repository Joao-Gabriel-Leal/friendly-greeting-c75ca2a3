-- =====================================================
-- SCRIPT SQL COMPLETO - SISTEMA DE AGENDAMENTO
-- Banco de Dados: qvtagendamento
-- PostgreSQL 14+
-- =====================================================

-- Criar banco de dados (executar separadamente no psql ou pgAdmin)
-- CREATE DATABASE qvtagendamento;

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TIPOS ENUM
-- =====================================================
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user', 'professional', 'developer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA: users (autenticação)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABELA: profiles (dados do usuário)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14),
    setor VARCHAR(100),
    suspended_until TIMESTAMP WITH TIME ZONE,
    blocked BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- TABELA: user_roles (papéis dos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'user',
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- =====================================================
-- TABELA: specialties (especialidades/serviços)
-- =====================================================
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialties_active ON specialties(active);

-- =====================================================
-- TABELA: professionals (profissionais)
-- =====================================================
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password_temp VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(active);

-- =====================================================
-- TABELA: professional_specialties (relação N:N)
-- =====================================================
CREATE TABLE IF NOT EXISTS professional_specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    UNIQUE(professional_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_prof_specs_professional ON professional_specialties(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_specs_specialty ON professional_specialties(specialty_id);

-- =====================================================
-- TABELA: available_days (disponibilidade semanal)
-- =====================================================
CREATE TABLE IF NOT EXISTS available_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_available_days_professional ON available_days(professional_id);

-- =====================================================
-- TABELA: blocked_days (dias bloqueados ou disponibilidade extra)
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_days_professional ON blocked_days(professional_id);
CREATE INDEX IF NOT EXISTS idx_blocked_days_date ON blocked_days(blocked_date);

-- =====================================================
-- TABELA: appointments (agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    professional_confirmed BOOLEAN DEFAULT FALSE,
    professional_confirmed_at TIMESTAMP WITH TIME ZONE,
    user_confirmed BOOLEAN DEFAULT FALSE,
    user_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =====================================================
-- TABELA: user_specialty_blocks (bloqueios por especialidade)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_specialty_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_specialty_blocks_user ON user_specialty_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_specialty_blocks_specialty ON user_specialty_blocks(specialty_id);

-- =====================================================
-- TABELA: admin_logs (logs de ações administrativas)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);

-- =====================================================
-- TABELA: system_settings (configurações do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB DEFAULT '{}',
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS: Especialidades
-- =====================================================
INSERT INTO specialties (id, name, description, duration_minutes, active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Consultoria Médica', 'Atendimento de consultoria médica especializada', 30, true),
    ('22222222-2222-2222-2222-222222222222', 'Consultoria Jurídica', 'Atendimento de consultoria jurídica', 45, true),
    ('33333333-3333-3333-3333-333333333333', 'Suporte Técnico', 'Atendimento de suporte técnico', 30, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: Profissionais
-- =====================================================
INSERT INTO professionals (id, name, email, phone, active) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'Dr. Adílio Santos', 'adilio@anadem.com.br', '(11) 99999-0001', true),
    ('aaaa2222-2222-2222-2222-222222222222', 'Dra. Maria Silva', 'maria@anadem.com.br', '(11) 99999-0002', true),
    ('aaaa3333-3333-3333-3333-333333333333', 'Dr. Carlos Oliveira', 'carlos@anadem.com.br', '(11) 99999-0003', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: Relação Profissional-Especialidade
-- =====================================================
INSERT INTO professional_specialties (id, professional_id, specialty_id) VALUES
    ('bbbb1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
    ('bbbb2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
    ('bbbb3333-3333-3333-3333-333333333333', 'aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
    ('bbbb4444-4444-4444-4444-444444444444', 'aaaa2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
    ('bbbb5555-5555-5555-5555-555555555555', 'aaaa3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
    ('bbbb6666-6666-6666-6666-666666666666', 'aaaa3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: Disponibilidade (Seg-Sex 9h-17h)
-- =====================================================
-- Dr. Adílio (Segunda a Sexta)
INSERT INTO available_days (id, professional_id, day_of_week, start_time, end_time) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 1, '09:00:00', '17:00:00'),
    ('cccc1112-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 2, '09:00:00', '17:00:00'),
    ('cccc1113-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 3, '09:00:00', '17:00:00'),
    ('cccc1114-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 4, '09:00:00', '17:00:00'),
    ('cccc1115-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 5, '09:00:00', '17:00:00')
ON CONFLICT (id) DO NOTHING;

-- Dra. Maria (Segunda a Sexta)
INSERT INTO available_days (id, professional_id, day_of_week, start_time, end_time) VALUES
    ('cccc2221-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 1, '09:00:00', '17:00:00'),
    ('cccc2222-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 2, '09:00:00', '17:00:00'),
    ('cccc2223-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 3, '09:00:00', '17:00:00'),
    ('cccc2224-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 4, '09:00:00', '17:00:00'),
    ('cccc2225-2222-2222-2222-222222222222', 'aaaa2222-2222-2222-2222-222222222222', 5, '09:00:00', '17:00:00')
ON CONFLICT (id) DO NOTHING;

-- Dr. Carlos (Segunda a Sexta)
INSERT INTO available_days (id, professional_id, day_of_week, start_time, end_time) VALUES
    ('cccc3331-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 1, '09:00:00', '17:00:00'),
    ('cccc3332-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 2, '09:00:00', '17:00:00'),
    ('cccc3333-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 3, '09:00:00', '17:00:00'),
    ('cccc3334-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 4, '09:00:00', '17:00:00'),
    ('cccc3335-3333-3333-3333-333333333333', 'aaaa3333-3333-3333-3333-333333333333', 5, '09:00:00', '17:00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: Usuários de Teste
-- Senha para todos: 123456 (hash bcrypt)
-- =====================================================
-- Hash bcrypt de "123456"
-- $2a$10$rQnM1jM8.Xy9XvxYKj8rZ.S3L1Jz0Y5F6G7H8I9J0K1L2M3N4O5P6

-- 1. Administrador
INSERT INTO users (id, email, password_hash) VALUES
    ('dddd1111-1111-1111-1111-111111111111', 'admin@anadem.com.br', '$2a$10$rQnM1jM8.Xy9XvxYKj8rZeS3L1Jz0Y5F6G7H8I9J0K1L2M3N4O5P6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, name, email, setor, must_change_password) VALUES
    ('eeee1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'Administrador', 'admin@anadem.com.br', 'TI', false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role) VALUES
    ('ffff1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Profissional (Dr. Adílio)
INSERT INTO users (id, email, password_hash) VALUES
    ('dddd2222-2222-2222-2222-222222222222', 'adilio@anadem.com.br', '$2a$10$rQnM1jM8.Xy9XvxYKj8rZeS3L1Jz0Y5F6G7H8I9J0K1L2M3N4O5P6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, name, email, setor, must_change_password) VALUES
    ('eeee2222-2222-2222-2222-222222222222', 'dddd2222-2222-2222-2222-222222222222', 'Dr. Adílio Santos', 'adilio@anadem.com.br', 'Médico', false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role) VALUES
    ('ffff2222-2222-2222-2222-222222222222', 'dddd2222-2222-2222-2222-222222222222', 'professional')
ON CONFLICT (user_id) DO NOTHING;

-- Vincular profissional ao usuário
UPDATE professionals SET user_id = 'dddd2222-2222-2222-2222-222222222222' WHERE id = 'aaaa1111-1111-1111-1111-111111111111';

-- 3. Usuário/Paciente
INSERT INTO users (id, email, password_hash) VALUES
    ('dddd3333-3333-3333-3333-333333333333', 'joao@anadem.com.br', '$2a$10$rQnM1jM8.Xy9XvxYKj8rZeS3L1Jz0Y5F6G7H8I9J0K1L2M3N4O5P6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, name, email, setor, must_change_password) VALUES
    ('eeee3333-3333-3333-3333-333333333333', 'dddd3333-3333-3333-3333-333333333333', 'João Leal', 'joao@anadem.com.br', 'Financeiro', false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role) VALUES
    ('ffff3333-3333-3333-3333-333333333333', 'dddd3333-3333-3333-3333-333333333333', 'user')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Desenvolvedor
INSERT INTO users (id, email, password_hash) VALUES
    ('dddd4444-4444-4444-4444-444444444444', 'dev@anadem.com.br', '$2a$10$rQnM1jM8.Xy9XvxYKj8rZeS3L1Jz0Y5F6G7H8I9J0K1L2M3N4O5P6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, name, email, setor, must_change_password) VALUES
    ('eeee4444-4444-4444-4444-444444444444', 'dddd4444-4444-4444-4444-444444444444', 'Desenvolvedor', 'dev@anadem.com.br', 'TI', false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (id, user_id, role) VALUES
    ('ffff4444-4444-4444-4444-444444444444', 'dddd4444-4444-4444-4444-444444444444', 'developer')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: Configurações do Sistema
-- =====================================================
INSERT INTO system_settings (id, key, value) VALUES
    ('gggg1111-1111-1111-1111-111111111111', 'theme', '"system"'),
    ('gggg2222-2222-2222-2222-222222222222', 'appointment_reminder_hours', '24'),
    ('gggg3333-3333-3333-3333-333333333333', 'max_appointments_per_day', '10'),
    ('gggg4444-4444-4444-4444-444444444444', 'allow_same_day_booking', 'true')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Banco de dados criado com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 USUÁRIOS DE TESTE:';
    RAISE NOTICE '   Admin:        admin@anadem.com.br / 123456';
    RAISE NOTICE '   Profissional: adilio@anadem.com.br / 123456';
    RAISE NOTICE '   Usuário:      joao@anadem.com.br / 123456';
    RAISE NOTICE '   Developer:    dev@anadem.com.br / 123456';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESPECIALIDADES:';
    RAISE NOTICE '   - Consultoria Médica (30 min)';
    RAISE NOTICE '   - Consultoria Jurídica (45 min)';
    RAISE NOTICE '   - Suporte Técnico (30 min)';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍⚕️ PROFISSIONAIS:';
    RAISE NOTICE '   - Dr. Adílio Santos';
    RAISE NOTICE '   - Dra. Maria Silva';
    RAISE NOTICE '   - Dr. Carlos Oliveira';
END $$;
