-- ================================================
-- SQL COMPLETO - Sistema de Agendamentos Anadem
-- PostgreSQL - Com dados de teste
-- ================================================

-- Limpar banco (se existir)
DROP TABLE IF EXISTS specialty_blocks CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS blocked_days CASCADE;
DROP TABLE IF EXISTS available_days CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS professional_specialties CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================
-- CRIAÇÃO DAS TABELAS
-- ================================================

-- Tabela: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: profiles
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(14),
    setor VARCHAR(100),
    suspended_until TIMESTAMP,
    blocked BOOLEAN DEFAULT FALSE,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: specialties
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professionals
CREATE TABLE professionals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professional_specialties (relação N:N)
CREATE TABLE professional_specialties (
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, specialty_id)
);

-- Tabela: appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    professional_confirmed BOOLEAN DEFAULT FALSE,
    professional_confirmed_at TIMESTAMP,
    user_confirmed BOOLEAN DEFAULT FALSE,
    user_confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: available_days
CREATE TABLE available_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: blocked_days
CREATE TABLE blocked_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: specialty_blocks
CREATE TABLE specialty_blocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_until TIMESTAMP,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: system_settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- INSERÇÃO DE DADOS DE TESTE
-- ================================================

-- 1. USUÁRIOS
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (email, password_hash, role) VALUES
('admin@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'admin'),
('joao.silva@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('maria.santos@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('pedro.costa@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('dra.ana@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional'),
('dr.carlos@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional'),
('nutri.paula@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional');

-- 2. PERFIS
INSERT INTO profiles (user_id, name, email, phone, cpf, setor) VALUES
(1, 'Administrador', 'admin@anadem.com', '(11) 99999-0000', '000.000.000-00', 'Administração'),
(2, 'João Silva', 'joao.silva@anadem.com', '(11) 98888-1111', '111.111.111-11', 'TI'),
(3, 'Maria Santos', 'maria.santos@anadem.com', '(11) 98888-2222', '222.222.222-22', 'RH'),
(4, 'Pedro Costa', 'pedro.costa@anadem.com', '(11) 98888-3333', '333.333.333-33', 'Financeiro'),
(5, 'Dra. Ana Paula', 'dra.ana@anadem.com', '(11) 98888-4444', '444.444.444-44', 'Psicologia'),
(6, 'Dr. Carlos Eduardo', 'dr.carlos@anadem.com', '(11) 98888-5555', '555.555.555-55', 'Massoterapia'),
(7, 'Nutricionista Paula', 'nutri.paula@anadem.com', '(11) 98888-6666', '666.666.666-66', 'Nutrição');

-- 3. ESPECIALIDADES
INSERT INTO specialties (name, description, duration_minutes, active) VALUES
('Massoterapia', 'Terapia através de massagens terapêuticas e relaxantes', 60, TRUE),
('Psicologia', 'Atendimento psicológico individual e em grupo', 50, TRUE),
('Nutrição', 'Consulta nutricional e planejamento alimentar', 45, TRUE);

-- 4. PROFISSIONAIS
INSERT INTO professionals (user_id, name, email, phone, active) VALUES
(5, 'Dra. Ana Paula Oliveira', 'dra.ana@anadem.com', '(11) 98888-4444', TRUE),
(6, 'Dr. Carlos Eduardo Silva', 'dr.carlos@anadem.com', '(11) 98888-5555', TRUE),
(7, 'Nutricionista Paula Costa', 'nutri.paula@anadem.com', '(11) 98888-6666', TRUE);

-- 5. RELACIONAMENTO PROFISSIONAIS <-> ESPECIALIDADES
INSERT INTO professional_specialties (professional_id, specialty_id) VALUES
(1, 2),  -- Dra. Ana -> Psicologia
(2, 1),  -- Dr. Carlos -> Massoterapia
(3, 3);  -- Nutri Paula -> Nutrição

-- 6. DIAS DISPONÍVEIS DOS PROFISSIONAIS
-- Dra. Ana (Psicóloga) - Segunda a Sexta: 08:00-17:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(1, 0, '08:00', '17:00'),  -- Segunda
(1, 1, '08:00', '17:00'),  -- Terça
(1, 2, '08:00', '17:00'),  -- Quarta
(1, 3, '08:00', '17:00'),  -- Quinta
(1, 4, '08:00', '17:00');  -- Sexta

-- Dr. Carlos (Massoterapeuta) - Segunda a Sexta: 09:00-18:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(2, 0, '09:00', '18:00'),  -- Segunda
(2, 1, '09:00', '18:00'),  -- Terça
(2, 2, '09:00', '18:00'),  -- Quarta
(2, 3, '09:00', '18:00'),  -- Quinta
(2, 4, '09:00', '18:00');  -- Sexta

-- Nutri Paula - Segunda, Quarta e Sexta: 08:00-16:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(3, 0, '08:00', '16:00'),  -- Segunda
(3, 2, '08:00', '16:00'),  -- Quarta
(3, 4, '08:00', '16:00');  -- Sexta

-- 7. AGENDAMENTOS DE EXEMPLO
-- (Ajuste as datas conforme necessário)
INSERT INTO appointments (user_id, professional_id, specialty_id, appointment_date, appointment_time, status, notes) VALUES
(2, 1, 2, '2026-01-27', '10:00', 'scheduled', 'Primeira consulta'),
(3, 2, 1, '2026-01-27', '14:00', 'scheduled', 'Massagem relaxante'),
(4, 3, 3, '2026-01-28', '09:00', 'scheduled', 'Planejamento alimentar');

-- 8. CONFIGURAÇÕES DO SISTEMA
INSERT INTO system_settings (key, value) VALUES
('system_name', '"Sistema de Agendamentos Anadem"'),
('max_appointments_per_day', '10'),
('allow_same_day_booking', 'true');

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_available_days_professional ON available_days(professional_id);
CREATE INDEX idx_blocked_days_date ON blocked_days(blocked_date);

-- ================================================
-- CONSULTAS DE VERIFICAÇÃO
-- ================================================

-- Ver todos os usuários
-- SELECT u.id, u.email, u.role, p.name FROM users u LEFT JOIN profiles p ON u.id = p.user_id;

-- Ver todos os profissionais e suas especialidades
-- SELECT prof.name, s.name as specialty 
-- FROM professionals prof
-- JOIN professional_specialties ps ON prof.id = ps.professional_id
-- JOIN specialties s ON ps.specialty_id = s.id;

-- Ver agendamentos
-- SELECT 
--     a.appointment_date, a.appointment_time, 
--     p.name as patient, 
--     prof.name as professional, 
--     s.name as specialty,
--     a.status
-- FROM appointments a
-- JOIN profiles p ON a.user_id = p.user_id
-- JOIN professionals prof ON a.professional_id = prof.id
-- JOIN specialties s ON a.specialty_id = s.id
-- ORDER BY a.appointment_date, a.appointment_time;

-- ================================================
-- FIM DO SCRIPT
-- ================================================

-- Mensagem de sucesso
SELECT 'Banco de dados criado com sucesso!' as status,
       (SELECT COUNT(*) FROM users) as total_usuarios,
       (SELECT COUNT(*) FROM professionals) as total_profissionais,
       (SELECT COUNT(*) FROM specialties) as total_especialidades,
       (SELECT COUNT(*) FROM appointments) as total_agendamentos;
