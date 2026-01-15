-- =====================================================
-- SCRIPT SQL COMPLETO - SISTEMA DE AGENDAMENTO
-- Banco de Dados: qvtagendamento
-- PostgreSQL 14+
-- IDs NUMÉRICOS (SERIAL)
-- =====================================================

-- Criar banco de dados (executar separadamente no psql ou pgAdmin)
-- CREATE DATABASE qvtagendamento;

-- =====================================================
-- LIMPAR TABELAS EXISTENTES (para reinstalação limpa)
-- =====================================================
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS user_specialty_blocks CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS blocked_days CASCADE;
DROP TABLE IF EXISTS available_days CASCADE;
DROP TABLE IF EXISTS professional_specialties CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

-- =====================================================
-- TIPOS ENUM
-- =====================================================
CREATE TYPE app_role AS ENUM ('admin', 'user', 'professional', 'developer');

-- =====================================================
-- TABELA: users (autenticação)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- TABELA: profiles (dados do usuário)
-- =====================================================
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- TABELA: user_roles (papéis dos usuários)
-- =====================================================
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role DEFAULT 'user',
    UNIQUE(user_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- =====================================================
-- TABELA: specialties (especialidades/serviços)
-- =====================================================
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_specialties_active ON specialties(active);

-- =====================================================
-- TABELA: professionals (profissionais)
-- =====================================================
CREATE TABLE professionals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    password_temp VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_active ON professionals(active);

-- =====================================================
-- TABELA: professional_specialties (relação N:N)
-- =====================================================
CREATE TABLE professional_specialties (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    UNIQUE(professional_id, specialty_id)
);

CREATE INDEX idx_prof_specs_professional ON professional_specialties(professional_id);
CREATE INDEX idx_prof_specs_specialty ON professional_specialties(specialty_id);

-- =====================================================
-- TABELA: available_days (disponibilidade semanal)
-- =====================================================
CREATE TABLE available_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE INDEX idx_available_days_professional ON available_days(professional_id);

-- =====================================================
-- TABELA: blocked_days (dias bloqueados ou disponibilidade extra)
-- =====================================================
CREATE TABLE blocked_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_days_professional ON blocked_days(professional_id);
CREATE INDEX idx_blocked_days_date ON blocked_days(blocked_date);

-- =====================================================
-- TABELA: appointments (agendamentos)
-- =====================================================
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL,
    specialty_id INTEGER REFERENCES specialties(id) ON DELETE SET NULL,
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

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =====================================================
-- TABELA: user_specialty_blocks (bloqueios por especialidade)
-- =====================================================
CREATE TABLE user_specialty_blocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_specialty_blocks_user ON user_specialty_blocks(user_id);
CREATE INDEX idx_user_specialty_blocks_specialty ON user_specialty_blocks(specialty_id);

-- =====================================================
-- TABELA: admin_logs (logs de ações administrativas)
-- =====================================================
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_id INTEGER,
    target_type VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at);

-- =====================================================
-- TABELA: system_settings (configurações do sistema)
-- =====================================================
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB DEFAULT '{}',
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

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

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS: Especialidades
-- =====================================================
INSERT INTO specialties (name, description, duration_minutes, active) VALUES
    ('Consultoria Médica', 'Atendimento de consultoria médica especializada', 30, true),
    ('Consultoria Jurídica', 'Atendimento de consultoria jurídica', 45, true),
    ('Suporte Técnico', 'Atendimento de suporte técnico', 30, true);

-- =====================================================
-- DADOS INICIAIS: Profissionais
-- =====================================================
INSERT INTO professionals (name, email, phone, active) VALUES
    ('Dr. Adílio Santos', 'adilio@anadem.com.br', '(11) 99999-0001', true),
    ('Dra. Maria Silva', 'maria@anadem.com.br', '(11) 99999-0002', true),
    ('Dr. Carlos Oliveira', 'carlos@anadem.com.br', '(11) 99999-0003', true);

-- =====================================================
-- DADOS INICIAIS: Relação Profissional-Especialidade
-- =====================================================
-- Dr. Adílio (id=1) atende Consultoria Médica (id=1) e Jurídica (id=2)
INSERT INTO professional_specialties (professional_id, specialty_id) VALUES
    (1, 1),
    (1, 2);

-- Dra. Maria (id=2) atende Consultoria Médica (id=1) e Suporte Técnico (id=3)
INSERT INTO professional_specialties (professional_id, specialty_id) VALUES
    (2, 1),
    (2, 3);

-- Dr. Carlos (id=3) atende Consultoria Jurídica (id=2) e Suporte Técnico (id=3)
INSERT INTO professional_specialties (professional_id, specialty_id) VALUES
    (3, 2),
    (3, 3);

-- =====================================================
-- DADOS INICIAIS: Disponibilidade (Seg-Sex 9h-17h)
-- =====================================================
-- Dr. Adílio (id=1) - Segunda a Sexta
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
    (1, 1, '09:00:00', '17:00:00'),
    (1, 2, '09:00:00', '17:00:00'),
    (1, 3, '09:00:00', '17:00:00'),
    (1, 4, '09:00:00', '17:00:00'),
    (1, 5, '09:00:00', '17:00:00');

-- Dra. Maria (id=2) - Segunda a Sexta
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
    (2, 1, '09:00:00', '17:00:00'),
    (2, 2, '09:00:00', '17:00:00'),
    (2, 3, '09:00:00', '17:00:00'),
    (2, 4, '09:00:00', '17:00:00'),
    (2, 5, '09:00:00', '17:00:00');

-- Dr. Carlos (id=3) - Segunda a Sexta
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
    (3, 1, '09:00:00', '17:00:00'),
    (3, 2, '09:00:00', '17:00:00'),
    (3, 3, '09:00:00', '17:00:00'),
    (3, 4, '09:00:00', '17:00:00'),
    (3, 5, '09:00:00', '17:00:00');

-- =====================================================
-- DADOS INICIAIS: Usuários de Teste
-- Senha para todos: 123456 (hash bcrypt)
-- =====================================================
-- Hash bcrypt de "123456"
-- $2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9.m

-- 1. Administrador
INSERT INTO users (email, password_hash) VALUES
    ('admin@anadem.com.br', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9.m');

INSERT INTO profiles (user_id, name, email, setor, must_change_password) VALUES
    (1, 'Administrador', 'admin@anadem.com.br', 'TI', false);

INSERT INTO user_roles (user_id, role) VALUES
    (1, 'admin');

-- 2. Profissional (Dr. Adílio)
INSERT INTO users (email, password_hash) VALUES
    ('adilio@anadem.com.br', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9.m');

INSERT INTO profiles (user_id, name, email, setor, must_change_password) VALUES
    (2, 'Dr. Adílio Santos', 'adilio@anadem.com.br', 'Médico', false);

INSERT INTO user_roles (user_id, role) VALUES
    (2, 'professional');

-- Vincular profissional ao usuário
UPDATE professionals SET user_id = 2 WHERE id = 1;

-- 3. Usuário/Paciente
INSERT INTO users (email, password_hash) VALUES
    ('joao@anadem.com.br', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9.m');

INSERT INTO profiles (user_id, name, email, setor, must_change_password) VALUES
    (3, 'João Leal', 'joao@anadem.com.br', 'Financeiro', false);

INSERT INTO user_roles (user_id, role) VALUES
    (3, 'user');

-- 4. Desenvolvedor
INSERT INTO users (email, password_hash) VALUES
    ('dev@anadem.com.br', '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu9.m');

INSERT INTO profiles (user_id, name, email, setor, must_change_password) VALUES
    (4, 'Desenvolvedor', 'dev@anadem.com.br', 'TI', false);

INSERT INTO user_roles (user_id, role) VALUES
    (4, 'developer');

-- =====================================================
-- DADOS INICIAIS: Configurações do Sistema
-- =====================================================
INSERT INTO system_settings (key, value) VALUES
    ('theme', '"system"'),
    ('appointment_reminder_hours', '24'),
    ('max_appointments_per_day', '10'),
    ('allow_same_day_booking', 'true');

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
    RAISE NOTICE '   ID 1 - Consultoria Médica (30 min)';
    RAISE NOTICE '   ID 2 - Consultoria Jurídica (45 min)';
    RAISE NOTICE '   ID 3 - Suporte Técnico (30 min)';
    RAISE NOTICE '';
    RAISE NOTICE '👨‍⚕️ PROFISSIONAIS:';
    RAISE NOTICE '   ID 1 - Dr. Adílio Santos';
    RAISE NOTICE '   ID 2 - Dra. Maria Silva';
    RAISE NOTICE '   ID 3 - Dr. Carlos Oliveira';
END $$;
