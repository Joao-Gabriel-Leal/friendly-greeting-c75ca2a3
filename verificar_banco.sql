-- ================================================
-- SCRIPT DE VERIFICAÇÃO DO BANCO DE DADOS
-- Execute após rodar database_completo.sql
-- ================================================

\echo ''
\echo '================================================'
\echo 'VERIFICANDO BANCO DE DADOS'
\echo '================================================'
\echo ''

-- 1. Verificar Tabelas
\echo '1. TABELAS CRIADAS:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

\echo ''
\echo '2. CONTAGEM DE DADOS:'

-- Contagem geral
SELECT 
    'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'specialties', COUNT(*) FROM specialties
UNION ALL
SELECT 'professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'professional_specialties', COUNT(*) FROM professional_specialties
UNION ALL
SELECT 'available_days', COUNT(*) FROM available_days
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'blocked_days', COUNT(*) FROM blocked_days
UNION ALL
SELECT 'specialty_blocks', COUNT(*) FROM specialty_blocks
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings;

\echo ''
\echo '3. USUÁRIOS CADASTRADOS:'
SELECT 
    u.id,
    u.email,
    u.role,
    p.name
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.id;

\echo ''
\echo '4. PROFISSIONAIS E ESPECIALIDADES:'
SELECT 
    prof.name as profissional,
    s.name as especialidade
FROM professionals prof
JOIN professional_specialties ps ON prof.id = ps.professional_id
JOIN specialties s ON ps.specialty_id = s.id
ORDER BY prof.name;

\echo ''
\echo '5. DISPONIBILIDADE DOS PROFISSIONAIS:'
SELECT 
    prof.name as profissional,
    CASE ad.day_of_week
        WHEN 0 THEN 'Segunda'
        WHEN 1 THEN 'Terça'
        WHEN 2 THEN 'Quarta'
        WHEN 3 THEN 'Quinta'
        WHEN 4 THEN 'Sexta'
        WHEN 5 THEN 'Sábado'
        WHEN 6 THEN 'Domingo'
    END as dia_semana,
    ad.start_time as inicio,
    ad.end_time as fim
FROM available_days ad
JOIN professionals prof ON ad.professional_id = prof.id
ORDER BY prof.name, ad.day_of_week;

\echo ''
\echo '6. AGENDAMENTOS:'
SELECT 
    a.id,
    a.appointment_date as data,
    a.appointment_time as horario,
    p.name as paciente,
    prof.name as profissional,
    s.name as especialidade,
    a.status
FROM appointments a
JOIN profiles p ON a.user_id = p.user_id
JOIN professionals prof ON a.professional_id = prof.id
JOIN specialties s ON a.specialty_id = s.id
ORDER BY a.appointment_date, a.appointment_time;

\echo ''
\echo '================================================'
\echo 'VERIFICAÇÃO CONCLUÍDA!'
\echo '================================================'
\echo ''
\echo 'RESUMO:'
\echo '-------'

SELECT 
    '✅ Total de Usuários: ' || COUNT(*) as info FROM users
UNION ALL
SELECT '✅ Total de Profissionais: ' || COUNT(*) FROM professionals
UNION ALL
SELECT '✅ Total de Especialidades: ' || COUNT(*) FROM specialties
UNION ALL
SELECT '✅ Total de Agendamentos: ' || COUNT(*) FROM appointments;

\echo ''
\echo 'CREDENCIAIS DE TESTE:'
\echo '--------------------'
\echo 'Admin: admin@anadem.com / admin123'
\echo 'Usuário: joao.silva@anadem.com / admin123'
\echo 'Profissional: dra.ana@anadem.com / admin123'
\echo ''
\echo '✅ Banco de dados está pronto para uso!'
\echo ''
