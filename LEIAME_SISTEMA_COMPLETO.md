# 📅 Sistema de Agendamentos Anadem - Documentação Completa para Replicação

> **⚠️ ATENÇÃO: VERSÃO COM BANCO DE DADOS LOCAL**
> Este sistema utiliza **exclusivamente** conexão com banco de dados PostgreSQL local.
> **NÃO utiliza Supabase, Firebase, ou qualquer serviço de nuvem para banco de dados.**
> Todo o backend roda localmente via Node.js + Express + PostgreSQL.

---

## 📋 Índice

1. [Visão Geral do Sistema](#-visão-geral-do-sistema)
2. [Arquitetura Técnica](#-arquitetura-técnica)
3. [Banco de Dados - SQL Completo](#-banco-de-dados---sql-completo)
4. [Credenciais do Banco](#-credenciais-do-banco-de-dados)
5. [Roles e Permissões](#-roles-e-permissões-de-usuário)
6. [Fluxo de Autenticação](#-fluxo-de-autenticação)
7. [Funcionalidades por Role](#-funcionalidades-por-role)
8. [Regras de Negócio](#-regras-de-negócio)
9. [API Endpoints](#-api-endpoints-completos)
10. [Estrutura de Arquivos](#-estrutura-de-arquivos)
11. [Como Rodar o Projeto](#-como-rodar-o-projeto)
12. [Detalhes de Implementação](#-detalhes-de-implementação)

---

## 🎯 Visão Geral do Sistema

O **Sistema de Agendamentos Anadem** é um portal interno corporativo onde **um administrador agenda sessões para os colaboradores** da empresa. Os colaboradores NÃO se cadastram sozinhos - o admin cria as contas.

### Especialidades oferecidas:
- 💆 **Massoterapia** - Sessões de massagem terapêutica (60 min)
- 🧠 **Psicologia** - Atendimento psicológico (50 min)
- 🥗 **Nutrição** - Consulta nutricional (45 min)

### Fluxo principal:
1. Admin acessa o sistema e cria contas para os colaboradores
2. Admin pode agendar sessões para si mesmo (aba "Meu Agendamento")
3. Colaboradores (role `user`) fazem login e agendam suas próprias sessões
4. Profissionais (role `professional`) visualizam e confirmam os agendamentos
5. Admin gerencia tudo: usuários, profissionais, disponibilidade, bloqueios

---

## 🏗️ Arquitetura Técnica

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│    React + Vite + TypeScript + Tailwind CSS      │
│    + shadcn/ui + React Router + TanStack Query   │
│    Porta: 5173 (dev) ou 8080                     │
└──────────────────┬──────────────────────────────┘
                   │ HTTP REST (JSON)
                   │ Authorization: Bearer <JWT>
┌──────────────────▼──────────────────────────────┐
│                   BACKEND                        │
│    Node.js + Express                             │
│    Porta: 3001                                   │
│    JWT para autenticação                         │
│    bcrypt para hash de senhas                    │
└──────────────────┬──────────────────────────────┘
                   │ SQL (pg driver)
┌──────────────────▼──────────────────────────────┐
│              BANCO DE DADOS                      │
│    PostgreSQL 15+                                │
│    Database: qvtagendamento                      │
│    Host: localhost | Porta: 5432                  │
└─────────────────────────────────────────────────┘
```

### Credenciais do Banco de Dados

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
```

### Configuração do Servidor Backend

```env
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao
```

### Configuração do Frontend

```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🗄️ Banco de Dados - SQL Completo

> **IMPORTANTE**: Você PRECISA rodar este SQL no seu PostgreSQL ANTES de iniciar o sistema.
> Primeiro crie o banco `qvtagendamento`, depois execute o SQL abaixo.

### Passo 1: Criar o banco

```sql
CREATE DATABASE qvtagendamento;
```

### Passo 2: Conectar ao banco e executar o SQL completo

```bash
psql -U postgres -d qvtagendamento -f database_completo.sql
```

### SQL Completo (database_completo.sql):

```sql
-- ================================================
-- SQL COMPLETO - Sistema de Agendamentos Anadem
-- PostgreSQL - Versão Local (sem Supabase)
-- IDs numéricos auto-incrementais (SERIAL)
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
-- TABELAS
-- ================================================

-- Tabela: users (autenticação)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',  -- 'user', 'admin', 'professional', 'developer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: profiles (dados pessoais)
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(14),
    setor VARCHAR(100),
    suspended_until TIMESTAMP,       -- suspensão geral da conta
    blocked BOOLEAN DEFAULT FALSE,   -- bloqueio permanente da conta
    must_change_password BOOLEAN DEFAULT FALSE,  -- forçar troca de senha no primeiro login
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: specialties (especialidades médicas/terapêuticas)
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professionals (profissionais que atendem)
CREATE TABLE professionals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- link com conta de login
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: professional_specialties (relação N:N profissional <-> especialidade)
CREATE TABLE professional_specialties (
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, specialty_id)
);

-- Tabela: appointments (agendamentos)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'
    notes TEXT,
    professional_confirmed BOOLEAN DEFAULT FALSE,
    professional_confirmed_at TIMESTAMP,
    user_confirmed BOOLEAN DEFAULT FALSE,
    user_confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Impede agendamento duplicado no mesmo horário
    UNIQUE(professional_id, appointment_date, appointment_time)
);

-- Tabela: available_days (disponibilidade semanal dos profissionais)
CREATE TABLE available_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,  -- 0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: blocked_days (dias bloqueados - feriados, folgas)
CREATE TABLE blocked_days (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id INTEGER REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: specialty_blocks (bloqueio de especialidade por usuário)
-- Ex: usuário não compareceu em Psicologia, fica bloqueado por 2 meses
CREATE TABLE specialty_blocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_until TIMESTAMP,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: system_settings (configurações do sistema)
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_available_days_professional ON available_days(professional_id);
CREATE INDEX idx_blocked_days_date ON blocked_days(blocked_date);
CREATE INDEX idx_blocked_days_professional ON blocked_days(professional_id);
CREATE INDEX idx_specialty_blocks_user ON specialty_blocks(user_id);

-- ================================================
-- DADOS INICIAIS
-- ================================================

-- Senhas: todas são "admin123" (hash bcrypt)
-- Em produção, troque TODAS as senhas!

INSERT INTO users (email, password_hash, role) VALUES
('admin@anadem.com',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'admin'),
('joao.silva@anadem.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('maria.santos@anadem.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('pedro.costa@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'user'),
('dra.ana@anadem.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional'),
('dr.carlos@anadem.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional'),
('nutri.paula@anadem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVqZhuq', 'professional');

INSERT INTO profiles (user_id, name, email, phone, cpf, setor) VALUES
(1, 'Administrador',        'admin@anadem.com',        '(11) 99999-0000', '000.000.000-00', 'Administração'),
(2, 'João Silva',           'joao.silva@anadem.com',   '(11) 98888-1111', '111.111.111-11', 'TI'),
(3, 'Maria Santos',         'maria.santos@anadem.com', '(11) 98888-2222', '222.222.222-22', 'RH'),
(4, 'Pedro Costa',          'pedro.costa@anadem.com',  '(11) 98888-3333', '333.333.333-33', 'Financeiro'),
(5, 'Dra. Ana Paula',       'dra.ana@anadem.com',      '(11) 98888-4444', '444.444.444-44', 'Psicologia'),
(6, 'Dr. Carlos Eduardo',   'dr.carlos@anadem.com',    '(11) 98888-5555', '555.555.555-55', 'Massoterapia'),
(7, 'Nutricionista Paula',  'nutri.paula@anadem.com',  '(11) 98888-6666', '666.666.666-66', 'Nutrição');

INSERT INTO specialties (name, description, duration_minutes, active) VALUES
('Massoterapia', 'Terapia através de massagens terapêuticas e relaxantes', 60, TRUE),
('Psicologia',   'Atendimento psicológico individual e em grupo',          50, TRUE),
('Nutrição',     'Consulta nutricional e planejamento alimentar',           45, TRUE);

INSERT INTO professionals (user_id, name, email, phone, active) VALUES
(5, 'Dra. Ana Paula Oliveira',   'dra.ana@anadem.com',      '(11) 98888-4444', TRUE),
(6, 'Dr. Carlos Eduardo Silva',  'dr.carlos@anadem.com',    '(11) 98888-5555', TRUE),
(7, 'Nutricionista Paula Costa', 'nutri.paula@anadem.com',  '(11) 98888-6666', TRUE);

INSERT INTO professional_specialties (professional_id, specialty_id) VALUES
(1, 2),  -- Dra. Ana Paula -> Psicologia
(2, 1),  -- Dr. Carlos -> Massoterapia
(3, 3);  -- Nutri Paula -> Nutrição

-- Disponibilidade: Segunda a Sexta
-- Dra. Ana (Psicóloga): 08:00-17:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(1, 0, '08:00', '17:00'), (1, 1, '08:00', '17:00'), (1, 2, '08:00', '17:00'),
(1, 3, '08:00', '17:00'), (1, 4, '08:00', '17:00');

-- Dr. Carlos (Massoterapeuta): 09:00-18:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(2, 0, '09:00', '18:00'), (2, 1, '09:00', '18:00'), (2, 2, '09:00', '18:00'),
(2, 3, '09:00', '18:00'), (2, 4, '09:00', '18:00');

-- Nutri Paula: Segunda, Quarta e Sexta 08:00-16:00
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES
(3, 0, '08:00', '16:00'), (3, 2, '08:00', '16:00'), (3, 4, '08:00', '16:00');

-- Configurações do sistema
INSERT INTO system_settings (key, value) VALUES
('system_name', '"Sistema de Agendamentos Anadem"'),
('max_appointments_per_day', '10'),
('allow_same_day_booking', 'true'),
('show_setup_button', '{"visible": false}'),
('theme_toggle_visible', '{"visible": true}');

-- Verificação final
SELECT 'Banco de dados criado com sucesso!' as status,
       (SELECT COUNT(*) FROM users) as total_usuarios,
       (SELECT COUNT(*) FROM professionals) as total_profissionais,
       (SELECT COUNT(*) FROM specialties) as total_especialidades;
```

---

## 🔑 Roles e Permissões de Usuário

O sistema tem **4 roles** distintos, definidos na coluna `users.role`:

| Role | Descrição | Permissões |
|------|-----------|-----------|
| `user` | Colaborador comum | Visualizar especialidades, agendar sessões para si, ver/cancelar próprios agendamentos |
| `professional` | Profissional (médico/terapeuta) | Ver seus agendamentos, confirmar presença, marcar no-show |
| `admin` | Administrador | Tudo do user + gerenciar usuários, profissionais, disponibilidade, bloqueios, relatórios, agendar para si mesmo |
| `developer` | Desenvolvedor (super-admin) | Tudo do admin + configurações do sistema, ver TODOS os usuários incluindo admins |

### Diferenças Admin vs Developer:
- **Admin**: NÃO vê a aba "Configurações"; NÃO vê outros admins/developers na lista de usuários; TEM aba "Meu Agendamento"
- **Developer**: VÊ a aba "Configurações"; VÊ todos os usuários; NÃO tem aba "Meu Agendamento"

---

## 🔐 Fluxo de Autenticação

### Login:
1. Usuário entra com email + senha na tela `/auth`
2. Backend valida credenciais via bcrypt
3. Se válido, retorna JWT token + dados do perfil + role
4. Frontend armazena token no `localStorage`
5. Todas as requisições subsequentes enviam `Authorization: Bearer <token>`

### Verificação de sessão:
- Ao carregar o app, frontend chama `GET /api/auth/me` com o token
- Se token válido, retorna dados do usuário
- Se inválido/expirado, redireciona para `/auth`

### Conta bloqueada:
- Se `profiles.blocked = true`, o login é rejeitado com mensagem "Conta bloqueada"

### Troca de senha obrigatória:
- Se `profiles.must_change_password = true`, após login o usuário é forçado a trocar a senha antes de acessar o dashboard
- Novos usuários criados pelo admin recebem senha padrão "123456" e `must_change_password = true`

### Credenciais de teste:

| Email | Senha | Role |
|-------|-------|------|
| admin@anadem.com | admin123 | Admin |
| joao.silva@anadem.com | admin123 | Usuário |
| maria.santos@anadem.com | admin123 | Usuário |
| pedro.costa@anadem.com | admin123 | Usuário |
| dra.ana@anadem.com | admin123 | Profissional |
| dr.carlos@anadem.com | admin123 | Profissional |
| nutri.paula@anadem.com | admin123 | Profissional |

---

## 📱 Funcionalidades por Role

### 👤 Usuário (Colaborador)

**Tela: UserDashboard** - Duas abas:

#### Aba "Novo Agendamento":
1. Seleciona uma **especialidade** (Massoterapia, Psicologia ou Nutrição)
2. Sistema mostra calendário + horários disponíveis lado a lado (DateTimeSelector)
3. Calendário mostra apenas dias em que o profissional atende
4. Horários mostram slots baseados na disponibilidade do profissional
5. Slots já reservados aparecem em cinza com texto "Reservado" (não clicáveis)
6. Ao confirmar, cria o agendamento com status `scheduled`

#### Aba "Meus Agendamentos":
- Lista todos os agendamentos do usuário
- Pode cancelar agendamentos futuros
- Vê status: Agendado, Confirmado, Cancelado, Não compareceu

#### Regras de bloqueio para agendamento:
- Usuário com **agendamento futuro pendente** → NÃO pode agendar novo
- Usuário com agendamento passado aguardando confirmação do profissional → NÃO pode agendar
- Após profissional confirmar (completed/no_show), pode agendar novamente
- Se suspenso (`suspended_until` no futuro) → NÃO pode agendar
- Se bloqueado em especialidade específica (`specialty_blocks`) → NÃO pode agendar aquela especialidade

### 👨‍⚕️ Profissional

**Tela: ProfessionalDashboard**

- Vê lista de agendamentos marcados para si
- Pode marcar como **"Compareceu"** (status → `completed`)
- Pode marcar como **"Não Compareceu"** (status → `no_show`)
- Filtros por data e status

### 🛡️ Admin

**Tela: AdminDashboard** - Várias abas:

#### 📋 Meu Agendamento (AdminMyBooking):
- Admin pode agendar sessões para si mesmo (mesmo fluxo do usuário)
- Só aparece para role `admin`, NÃO para `developer`

#### 📅 Agendamentos (AdminAppointments):
- Lista TODOS os agendamentos do sistema
- Filtros por data, profissional, status
- Pode cancelar qualquer agendamento

#### 👥 Usuários (AdminUsers):
- Lista todos os colaboradores (exclui profissionais da lista)
- Criar novo usuário (nome, email, telefone, departamento, senha padrão "123456")
- Editar nome, departamento, role
- Alterar senha de qualquer usuário
- Suspender conta (2 meses) - geral ou por especialidade
- Remover suspensão
- Bloquear conta permanentemente
- Desbloquear conta

#### 🏥 Profissionais (AdminProfessionals):
- Lista de profissionais cadastrados
- Criar/editar/desativar profissionais
- Associar profissional a especialidade

#### 📥 Importar Usuários (AdminImportUsers):
- Importação em lote de usuários
- Campos: nome, email, telefone, departamento
- Senha padrão: "123456" com `must_change_password = true`

#### ✅ Disponibilidade (AdminAvailableDays):
- Configurar dias/horários que cada profissional atende
- Dia da semana (0=Seg a 6=Dom) + horário início + horário fim

#### 🚫 Dias Bloqueados (AdminBlockedDays):
- Bloquear datas específicas (feriados, folgas)
- Por profissional ou por especialidade
- Motivo do bloqueio

#### 📊 Relatórios (AdminReports):
- Estatísticas de agendamentos
- Filtros por período

### 🔧 Developer (Configurações extras):

#### ⚙️ Configurações (AdminSettings):
- Toggle: Mostrar/ocultar botão de setup na tela de login
- Toggle: Mostrar/ocultar seletor de tema escuro para todos os usuários

---

## ⚙️ Regras de Negócio Detalhadas

### Agendamento:

1. **Prevenção de duplicidade**: Constraint UNIQUE em `(professional_id, appointment_date, appointment_time)` - impossível dois agendamentos no mesmo horário para o mesmo profissional

2. **Bloqueio de múltiplos agendamentos**: Usuário só pode ter 1 agendamento ativo (futuro e com status `scheduled`). Precisa cancelar ou aguardar conclusão para agendar novo

3. **Geração de slots**: 
   - Sistema busca `available_days` do profissional para o dia da semana selecionado
   - Gera slots a cada X minutos (baseado em `specialties.duration_minutes`)
   - Remove slots que já estão em `appointments` com status `scheduled`
   - Remove slots de `blocked_days`

4. **Feriados brasileiros**: Sistema reconhece feriados nacionais e impede agendamento nessas datas (arquivo `brazilianHolidays.ts`)

### Suspensão por especialidade:

- Admin pode suspender um usuário em especialidade(s) específica(s) por 2 meses
- Tabela `specialty_blocks` registra o bloqueio
- Usuário bloqueado em Psicologia pode agendar Massoterapia normalmente
- Admin pode remover suspensão a qualquer momento

### Status dos agendamentos:

| Status | Descrição |
|--------|-----------|
| `scheduled` | Agendado, aguardando a data |
| `completed` | Profissional confirmou presença |
| `cancelled` | Cancelado pelo usuário ou admin |
| `no_show` | Profissional marcou como não compareceu |

### Departamentos disponíveis:
- Expedição, Comercial, Jurídico, Compras, RH, Controladoria, Cirurgia Segura, Administrativo, TI, Financeiro, Presidência

---

## 🔌 API Endpoints Completos

Base URL: `http://localhost:3001/api`

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login (email + password) → token + profile + role | ❌ |
| POST | `/auth/register` | Cadastrar novo usuário | ❌ |
| GET | `/auth/me` | Retorna dados do usuário logado | ✅ |
| POST | `/auth/update-password` | Alterar senha (currentPassword + newPassword) | ✅ |

### Agendamentos (`/api/appointments`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/appointments` | Listar agendamentos (filtros: status, date, professional_id) | ✅ |
| GET | `/appointments/user/:userId` | Agendamentos de um usuário | ✅ |
| GET | `/appointments/professional/:professionalId` | Agendamentos de um profissional | ✅ |
| GET | `/appointments/check-existing` | Verificar agendamento existente | ✅ |
| GET | `/appointments/booked-slots` | Slots já reservados (professional_id + date) | ✅ |
| POST | `/appointments` | Criar agendamento | ✅ |
| PUT | `/appointments/:id` | Atualizar agendamento | ✅ |
| POST | `/appointments/:id/cancel` | Cancelar agendamento | ✅ |

### Profissionais (`/api/professionals`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/professionals` | Listar profissionais (?active=true) | ✅ |
| GET | `/professionals/:id` | Detalhes do profissional | ✅ |
| GET | `/professionals/user/:userId` | Profissional por user_id | ✅ |
| GET | `/professionals/by-specialty/:specialtyId` | Profissionais de uma especialidade | ✅ |
| POST | `/professionals` | Criar profissional | ✅ |
| PUT | `/professionals/:id` | Atualizar profissional | ✅ |
| DELETE | `/professionals/:id` | Deletar profissional | ✅ |

### Especialidades (`/api/specialties`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/specialties` | Listar especialidades (?active=true) | ✅ |
| GET | `/specialties/:id` | Detalhes da especialidade | ✅ |
| POST | `/specialties` | Criar especialidade | ✅ |
| PUT | `/specialties/:id` | Atualizar especialidade | ✅ |
| DELETE | `/specialties/:id` | Deletar especialidade | ✅ |

### Disponibilidade (`/api/availability`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/availability/professional/:id/days` | Dias disponíveis do profissional | ✅ |
| POST | `/availability/professional/:id/days` | Configurar disponibilidade | ✅ |
| GET | `/availability/slots` | Slots disponíveis (professional_id + date + duration) | ✅ |
| GET | `/availability/booked-slots` | Slots já reservados | ✅ |
| GET | `/availability/blocked` | Dias bloqueados (filtros) | ✅ |
| POST | `/availability/blocked` | Bloquear dia | ✅ |
| DELETE | `/availability/blocked/:id` | Desbloquear dia | ✅ |

### Perfis (`/api/profiles`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/profiles` | Listar todos os perfis | ✅ |
| GET | `/profiles/:id` | Perfil por ID | ✅ |
| GET | `/profiles/user/:userId` | Perfil por user_id | ✅ |
| PUT | `/profiles/:id` | Atualizar perfil | ✅ |
| POST | `/profiles/:userId/block` | Bloquear/desbloquear usuário | ✅ |
| POST | `/profiles/:userId/suspend` | Suspender/remover suspensão | ✅ |

### Bloqueios de Especialidade (`/api/specialty-blocks`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/specialty-blocks/user/:userId` | Bloqueios de um usuário | ✅ |
| POST | `/specialty-blocks` | Criar bloqueio | ✅ |
| DELETE | `/specialty-blocks/:id` | Remover bloqueio | ✅ |

### Configurações (`/api/settings`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/settings` | Todas as configurações | ✅ |
| GET | `/settings/:key` | Configuração específica | ✅ |
| PUT | `/settings/:key` | Atualizar configuração | ✅ |

---

## 📂 Estrutura de Arquivos

```
projeto/
├── frontend/
│   ├── .env                          # VITE_API_URL=http://localhost:3001/api
│   ├── index.html                    # HTML principal
│   ├── package.json                  # Dependências React
│   ├── vite.config.ts                # Configuração Vite
│   ├── tailwind.config.ts            # Configuração Tailwind
│   ├── public/
│   │   ├── anadem-icon.png           # Ícone do sidebar
│   │   └── anademicon.png            # Logo da tela de login
│   └── src/
│       ├── App.tsx                   # Rotas e Providers
│       ├── main.tsx                  # Entry point
│       ├── index.css                 # Estilos globais + tokens CSS
│       ├── lib/
│       │   ├── api.ts                # Cliente HTTP (fetch + JWT)
│       │   ├── auth.tsx              # AuthProvider + useAuth hook
│       │   ├── brazilianHolidays.ts  # Feriados brasileiros
│       │   ├── emailService.ts       # Serviço de email (placeholder)
│       │   ├── specialtyIcons.tsx    # Ícones por especialidade
│       │   └── utils.ts             # Utilitários (cn, etc)
│       ├── hooks/
│       │   ├── useAppData.tsx        # Provider de dados globais (profissionais, especialidades)
│       │   ├── useTheme.tsx          # Tema claro/escuro
│       │   └── useThemeSettings.tsx  # Configurações de tema
│       ├── pages/
│       │   ├── Auth.tsx              # Tela de login
│       │   ├── Dashboard.tsx         # Router por role
│       │   ├── ResetPassword.tsx     # Tela de reset de senha
│       │   └── NotFound.tsx          # 404
│       ├── components/
│       │   ├── ForcePasswordChange.tsx
│       │   ├── ThemeToggle.tsx
│       │   ├── ConditionalThemeToggle.tsx
│       │   ├── user/                 # Componentes do colaborador
│       │   │   ├── UserDashboard.tsx
│       │   │   ├── SpecialtySelector.tsx
│       │   │   ├── DateTimeSelector.tsx
│       │   │   ├── DateSelector.tsx
│       │   │   ├── TimeSelector.tsx
│       │   │   └── MyAppointments.tsx
│       │   ├── admin/                # Componentes do admin
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── AdminMyBooking.tsx
│       │   │   ├── AdminAppointments.tsx
│       │   │   ├── AdminUsers.tsx
│       │   │   ├── AdminProfessionals.tsx
│       │   │   ├── AdminImportUsers.tsx
│       │   │   ├── AdminAvailableDays.tsx
│       │   │   ├── AdminBlockedDays.tsx
│       │   │   ├── AdminReports.tsx
│       │   │   └── AdminSettings.tsx
│       │   ├── professional/         # Componentes do profissional
│       │   │   └── ProfessionalDashboard.tsx
│       │   └── ui/                   # shadcn/ui components
│       └── integrations/             # ⚠️ IGNORAR - legado Supabase, NÃO USAR
│
└── server/                           # Backend Node.js + Express
    ├── .env                          # Credenciais do banco
    ├── package.json                  # Dependências Node
    ├── index.js                      # Entry point Express
    ├── config/
    │   └── database.js               # Pool PostgreSQL (pg)
    ├── middleware/
    │   └── auth.js                   # Middleware JWT
    ├── routes/
    │   ├── auth.js                   # Rotas de autenticação
    │   ├── appointments.js           # Rotas de agendamentos
    │   ├── professionals.js          # Rotas de profissionais
    │   ├── specialties.js            # Rotas de especialidades
    │   ├── availability.js           # Rotas de disponibilidade
    │   ├── profiles.js               # Rotas de perfis
    │   ├── settings.js               # Rotas de configurações
    │   └── specialty-blocks.js       # Rotas de bloqueios
    └── database/
        └── setup.sql                 # SQL alternativo
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos:
- **Node.js** 18+
- **PostgreSQL** 15+
- **npm** ou **yarn**

### Passo 1: Banco de dados

```bash
# Criar o banco
psql -U postgres -c "CREATE DATABASE qvtagendamento;"

# Executar o SQL completo
psql -U postgres -d qvtagendamento -f database_completo.sql
```

### Passo 2: Backend

```bash
cd server/

# Criar arquivo .env
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui_mude_em_producao
EOF

# Instalar dependências
npm install

# Rodar
npm start
# Servidor em http://localhost:3001
```

### Passo 3: Frontend

```bash
cd frontend/

# Criar arquivo .env
cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
EOF

# Instalar dependências
npm install

# Rodar
npm run dev
# Frontend em http://localhost:5173
```

### Passo 4: Acessar

Abra `http://localhost:5173` e faça login:
- **Email**: `admin@anadem.com`
- **Senha**: `admin123`

---

## 🎨 Detalhes de Implementação

### Frontend - Stack:
- **React 18** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes (Button, Card, Dialog, Table, etc.)
- **React Router v6** para navegação
- **TanStack Query** para cache de dados
- **Lucide React** para ícones
- **date-fns** para manipulação de datas (com locale pt-BR)
- **zod** para validação de formulários
- **framer-motion** para animações (opcional)

### Backend - Stack:
- **Express.js** como framework HTTP
- **pg** (node-postgres) para conexão com PostgreSQL
- **bcryptjs** para hash de senhas
- **jsonwebtoken** para JWT
- **cors** para CORS
- **dotenv** para variáveis de ambiente

### Comunicação Frontend ↔ Backend:
- Toda comunicação via REST API JSON
- Token JWT enviado no header `Authorization: Bearer <token>`
- Cliente HTTP centralizado em `src/lib/api.ts`
- Sem uso de Supabase client - tudo via fetch nativo

### Tema:
- Suporte a tema claro e escuro
- Tokens CSS em `index.css` usando variáveis HSL
- Toggle de tema pode ser habilitado/desabilitado pelo developer nas configurações

### Ícones por especialidade:
- Massoterapia: ícone de mãos/massagem com cor roxa
- Psicologia: ícone de cérebro com cor azul
- Nutrição: ícone de maçã com cor verde

---

## ⚠️ Notas Importantes

1. **NÃO usar Supabase**: Todo o backend é local. A pasta `src/integrations/supabase/` é legado e NÃO deve ser utilizada.

2. **IDs numéricos**: Todas as tabelas usam `SERIAL` (auto-incremento) como primary key, NÃO UUIDs.

3. **Senha padrão**: Novos usuários criados pelo admin recebem senha "123456" e são forçados a trocar no primeiro login.

4. **CPF não obrigatório**: O campo CPF existe na tabela mas NÃO é obrigatório no cadastro.

5. **Email service**: O `emailService.ts` é um placeholder - as funções existem mas precisam de configuração SMTP real para enviar emails de notificação.

6. **Cada profissional atende UMA especialidade**: Apesar da tabela `professional_specialties` permitir N:N, o fluxo atual assume 1 profissional = 1 especialidade.

7. **Feriados**: O sistema reconhece feriados brasileiros nacionais e bloqueia agendamento nessas datas automaticamente.

---

**Desenvolvido para Anadem** 🏥
