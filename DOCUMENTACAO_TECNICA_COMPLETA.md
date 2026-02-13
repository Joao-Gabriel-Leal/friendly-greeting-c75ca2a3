# 📋 DOCUMENTAÇÃO TÉCNICA COMPLETA — Sistema de Agendamento Anadem

> **Objetivo**: Permitir a reconstrução idêntica do frontend e a criação do banco de dados PostgreSQL local (via DBeaver) sem erros de tipagem.

---

## 📌 RESUMO DO SISTEMA

Sistema web de agendamento corporativo para a empresa **Anadem**. Colaboradores agendam sessões de especialidades (Massoterapia, Psicólogo, Nutricionista, etc.) com profissionais cadastrados. O sistema roda 100% local com:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express (porta 3001)
- **Banco de Dados**: PostgreSQL local (gerenciado via DBeaver)

---

## 1. 🎨 IDENTIDADE VISUAL E UI

### 1.1 Paleta de Cores (Hexadecimal e HSL)

#### Tema Claro (Light Mode)
| Token | HSL | Hexadecimal | Uso |
|-------|-----|-------------|-----|
| `--background` | `0 0% 100%` | `#FFFFFF` | Fundo geral |
| `--foreground` | `0 0% 9%` | `#171717` | Texto principal |
| `--primary` | `159 50% 13%` | `#103025` | Cor principal (verde Anadem escuro) |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `178 100% 20%` | `#006662` | Verde Anadem secundário |
| `--secondary-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre secondary |
| `--muted` | `0 0% 96%` | `#F5F5F5` | Fundos sutis |
| `--muted-foreground` | `0 0% 45%` | `#737373` | Texto secundário |
| `--accent` | `159 30% 95%` | `#EEF6F3` | Destaque suave |
| `--accent-foreground` | `159 50% 13%` | `#103025` | Texto sobre accent |
| `--destructive` | `0 72% 50%` | `#DC2626` | Erros e ações destrutivas |
| `--border` | `0 0% 90%` | `#E5E5E5` | Bordas |
| `--ring` | `159 50% 13%` | `#103025` | Anel de foco |
| `--success` | `142 76% 36%` | `#16A34A` | Sucesso |
| `--warning` | `38 92% 50%` | `#F59E0B` | Alerta |
| `--info` | `199 89% 48%` | `#0EA5E9` | Informação |
| `--card` | `0 0% 100%` | `#FFFFFF` | Cards |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popovers |

#### Sidebar (Admin/Developer)
| Token | HSL | Hexadecimal |
|-------|-----|-------------|
| `--sidebar-background` | `159 50% 13%` | `#103025` |
| `--sidebar-foreground` | `0 0% 100%` | `#FFFFFF` |
| `--sidebar-primary` | `178 100% 20%` | `#006662` |
| `--sidebar-accent` | `178 100% 20%` | `#006662` |
| `--sidebar-border` | `159 40% 20%` | Variação do primary |

#### Tema Escuro (Dark Mode)
| Token | HSL | Hexadecimal |
|-------|-----|-------------|
| `--background` | `220 13% 18%` | `#282C34` |
| `--foreground` | `210 20% 95%` | `#F0F2F5` |
| `--primary` | `158 64% 45%` | `#2EBD8E` |
| `--card` | `220 13% 22%` | `#31353D` |
| `--muted` | `220 10% 30%` | `#454B55` |
| `--border` | `220 10% 32%` | `#4A5060` |

#### Cores de Especialidades (Gradientes Tailwind)
| Especialidade | Classes Tailwind |
|---------------|-----------------|
| Massagem | `from-rose-500 to-pink-500` |
| Nutricionista/Nutrição | `from-emerald-500 to-green-500` |
| Psicólogo/Psicologia | `from-violet-500 to-purple-500` |
| Médico | `from-blue-500 to-cyan-500` |
| Fisioterapia | `from-orange-500 to-amber-500` |
| Farmácia | `from-red-500 to-rose-500` |
| Estética | `from-fuchsia-500 to-pink-500` |
| Oftalmologia | `from-sky-500 to-blue-500` |
| Ortopedia | `from-slate-500 to-gray-500` |

### 1.2 Fontes

```
Fonte principal (sans):  'Plus Jakarta Sans' (body), 'Work Sans' (config)
Fonte serifada:          'Lora'
Fonte monoespaçada:      'Inconsolata'
```

**Google Fonts imports:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
@import url("https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap");
```

### 1.3 Border Radius

```
--radius: 0.75rem (12px) — Light Mode
--radius: 0.5rem  (8px) — Dark Mode
lg: var(--radius)
md: calc(var(--radius) - 2px)
sm: calc(var(--radius) - 4px)
```

### 1.4 Sombras (Box Shadows)

```css
--shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1);
--shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1);
--shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 4px 6px -1px hsl(0 0% 0% / 0.1);
--shadow-glow: 0 0 20px hsl(199 89% 48% / 0.3);
```

### 1.5 Ícones (Lucide React)

| Contexto | Ícone | Import |
|----------|-------|--------|
| Massagem | `Heart` | `lucide-react` |
| Nutricionista | `Apple` | `lucide-react` |
| Psicólogo | `Brain` | `lucide-react` |
| Médico | `Stethoscope` | `lucide-react` |
| Fisioterapia | `Activity` | `lucide-react` |
| Farmácia | `Pill` | `lucide-react` |
| Login | `LogIn` | `lucide-react` |
| Logout | `LogOut` | `lucide-react` |
| Calendário | `Calendar`, `CalendarDays`, `CalendarCheck`, `CalendarPlus` | `lucide-react` |
| Usuários | `Users`, `UserCog`, `UserPlus` | `lucide-react` |
| Bloqueio | `Ban`, `Lock`, `ShieldOff` | `lucide-react` |
| Confirmação | `CheckCircle`, `UserCheck` | `lucide-react` |
| Cancelamento | `XCircle`, `UserX` | `lucide-react` |
| Menu | `Menu`, `X` | `lucide-react` |
| Relatórios | `BarChart3` | `lucide-react` |
| Configurações | `Settings` | `lucide-react` |
| Importação | `FileUp` | `lucide-react` |
| Edição | `Edit`, `KeyRound` | `lucide-react` |
| Busca | `Search` | `lucide-react` |
| Loading | `Loader2` (com `animate-spin`) | `lucide-react` |

### 1.6 Branding/Assets

| Arquivo | Localização | Uso |
|---------|-------------|-----|
| `anademicon.png` | `/public/anademicon.png` | Logo na tela de login (120px) e favicon |
| `anadem-icon.png` | `/public/anadem-icon.png` | Ícone nos headers dos dashboards (32x32px) |

### 1.7 Configuração Tailwind (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      fontFamily: {
        sans: ['Work Sans', 'ui-sans-serif', 'system-ui', ...],
        mono: ['Inconsolata', 'ui-monospace', ...],
        serif: ['Lora', 'ui-serif', ...]
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;
```

---

## 2. 🗺️ ARQUITETURA DE TELAS E FLUXOS

### 2.1 Mapa de Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/` | Redireciona para `/dashboard` | — |
| `/auth` | `Auth.tsx` | Público (login) |
| `/reset-password` | `ResetPassword.tsx` | Público |
| `/dashboard` | `Dashboard.tsx` | Autenticado (redireciona por role) |
| `*` | `NotFound.tsx` | Público |

### 2.2 Fluxo de Login

```
Usuário acessa / → Redireciona para /dashboard → Sem token? → /auth

/auth:
  ┌─────────────────────────────────┐
  │  Logo Anadem (anademicon.png)   │
  │  "Portal de Agendamentos"       │
  │  Massoterapia • Psicólogo •     │
  │  Nutricionista                   │
  │                                  │
  │  ┌──────────────────────────┐   │
  │  │ Email                    │   │
  │  │ Senha                    │   │
  │  │ [Entrar]                 │   │
  │  └──────────────────────────┘   │
  └─────────────────────────────────┘

Após login → Verifica:
  1. Conta bloqueada? → Mostra "Conta bloqueada. Contate os administradores."
  2. Deve trocar senha? → Mostra ForcePasswordChange
  3. Role = developer? → AdminDashboard(showSettings=true, roleLabel="Desenvolvedor")
  4. Role = admin?     → AdminDashboard(showSettings=false, roleLabel="Admin")
  5. Role = professional? → ProfessionalDashboard
  6. Role = user?      → UserDashboard(isSuspended, suspendedUntil)
```

### 2.3 Dashboard do Usuário (User)

```
Header: [Logo Anadem] Agendamento | Olá, {nome} | [ThemeToggle] [Sair]

Tela Home:
  ┌─────────────────────────────┐
  │  "Bem-vindo ao Sistema"     │
  │                              │
  │  [📅 Novo Agendamento]      │ → Etapa: Especialidade
  │  [👤 Meus Agendamentos]     │ → Etapa: Lista
  │                              │
  │  Regras:                     │
  │  • 1 agendamento/mês/espec. │
  │  • Horários: 9h-17h         │
  │  • Cancelar no dia = 60d    │
  └─────────────────────────────┘

Fluxo de Agendamento:
  Home → Selecionar Especialidade → Selecionar Data/Hora → Confirmação → Meus Agendamentos
```

**Etapa 1 — SpecialtySelector:**
- Lista especialidades ativas com profissionais vinculados
- Cada especialidade tem ícone e cor de gradiente únicos
- Especialidades bloqueadas para o usuário mostram "Especialidade suspensa para você" (opacidade reduzida)

**Etapa 2 — DateTimeSelector:**
- Calendário para selecionar data
- Slots de horário baseados na disponibilidade do profissional
- Slots já reservados aparecem como "Reservado" (cinza, desabilitado)

**Etapa 3 — MyAppointments:**
- Lista de agendamentos do usuário com status
- Botão de cancelar (se não for no mesmo dia)
- Confirmação de presença pelo colaborador

### 2.4 Dashboard do Admin

```
Sidebar (verde escuro #103025):
  ┌──────────────────────┐
  │ [Logo] Admin         │
  │ {nome}               │
  ├──────────────────────┤
  │ 📅 Meu Agendamento  │ ← Admin também agenda para si
  │ 📋 Agendamentos     │
  │ 👥 Usuários          │
  │ 👨‍⚕️ Profissionais    │
  │ 📥 Importar Usuários │
  │ ✅ Disponibilidade   │
  │ 🚫 Dias Bloqueados  │
  │ 📊 Relatórios       │
  │ [Sair]               │
  └──────────────────────┘
```

**Abas do Admin:**

| Aba | Componente | Funcionalidade |
|-----|-----------|----------------|
| Meu Agendamento | `AdminMyBooking` | Admin agenda para outros colaboradores |
| Agendamentos | `AdminAppointments` | Ver todos, filtrar, cancelar, 3 views (lista/calendário/por profissional) |
| Usuários | `AdminUsers` | CRUD, trocar senha, editar, suspender por especialidade, bloquear conta |
| Profissionais | `AdminProfessionals` | CRUD, vincular especialidades, definir senha temporária |
| Importar Usuários | `AdminImportUsers` | Importação em massa via CSV/formulário |
| Disponibilidade | `AdminAvailableDays` | Configurar dias/horários de trabalho dos profissionais |
| Dias Bloqueados | `AdminBlockedDays` | Bloquear datas específicas (feriados, folgas) |
| Relatórios | `AdminReports` | Relatórios de uso e estatísticas |

### 2.5 Dashboard do Desenvolvedor

Idêntico ao Admin, mas com aba adicional:
| Aba | Componente | Funcionalidade |
|-----|-----------|----------------|
| ⚙️ Configurações | `AdminSettings` | Toggle "setup button", toggle "dark theme" para todos |

**Diferença**: Developer NÃO tem aba "Meu Agendamento". Developer vê TODOS os usuários (inclusive admins e outros developers).

### 2.6 Dashboard do Profissional

```
Header: [Logo Anadem] Painel do Profissional | Olá, {nome} | [ThemeToggle] [Sair]

Tabs:
  [Calendário] [Lista]

Calendário:
  - Selecionar data → ver agendamentos do dia
  - Datas com agendamentos ficam destacadas
  
  Para cada agendamento passado:
    - [Compareceu] → Marca como completed, aguarda assinatura do colaborador
    - [Faltou] → Marca como no_show
  
  Para cada agendamento futuro:
    - [Cancelar] → Dialog com motivo, envia email

Lista:
  - Tabela com todos os agendamentos futuros
  - Colunas: Data, Horário, Colaborador, Especialidade, Status, Ações
```

### 2.7 Gestão de Usuários (AdminUsers) — Ações por Usuário

Cada usuário na tabela tem um menu dropdown (ícone `⋮`) com 4 ações:

1. **🔑 Alterar Senha** → Dialog com campo de nova senha (mín. 6 chars)
2. **✏️ Editar Dados** → Dialog com nome, email (readonly), role (user/admin/developer), departamento (select)
3. **⏳ Suspender por Especialidade** → Dialog com checkboxes de especialidades (suspende por 2 meses)
4. **🔒 Bloquear Conta** → Dialog com motivo. Bloqueia completamente (mostra mensagem no login)

**Departamentos disponíveis:**
```
Expedição, Comercial, Jurídico, Compras, RH, Controladoria,
Cirurgia Segura, Administrativo, TI, Financeiro, Presidência
```

---

## 3. 📊 MODELAGEM DE DADOS (PostgreSQL Local)

### 3.1 Credenciais do Banco

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
```

### 3.2 Diagrama ER (Relacionamentos)

```
users (1) ──── (1) profiles
users (1) ──── (1) user_roles
users (1) ──── (N) appointments
users (1) ──── (N) user_specialty_blocks
professionals (1) ──── (N) appointments
professionals (N) ──── (N) specialties  [via professional_specialties]
professionals (1) ──── (N) available_days
professionals (1) ──── (N) blocked_days
specialties (1) ──── (N) appointments
specialties (1) ──── (N) blocked_days
specialties (1) ──── (N) user_specialty_blocks
users (1, optional) ──── (1) professionals
```

### 3.3 Schema Completo das Tabelas

#### TIPO ENUM

```sql
CREATE TYPE app_role AS ENUM ('admin', 'user', 'professional', 'developer');
```

#### TABELA: `users`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `email` | `VARCHAR(255)` | NOT NULL | — | **UNIQUE** |
| `password_hash` | `VARCHAR(255)` | NOT NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índice:** `idx_users_email ON users(email)`

#### TABELA: `profiles`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `user_id` | `INTEGER` | NOT NULL | — | **UNIQUE, FK → users(id) ON DELETE CASCADE** |
| `name` | `VARCHAR(255)` | NOT NULL | — | — |
| `email` | `VARCHAR(255)` | NOT NULL | — | — |
| `phone` | `VARCHAR(20)` | NULL | — | — |
| `cpf` | `VARCHAR(14)` | NULL | — | — |
| `setor` | `VARCHAR(100)` | NULL | — | — |
| `suspended_until` | `TIMESTAMPTZ` | NULL | — | — |
| `blocked` | `BOOLEAN` | NULL | `FALSE` | — |
| `must_change_password` | `BOOLEAN` | NOT NULL | `TRUE` | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_profiles_user_id`, `idx_profiles_email`

#### TABELA: `user_roles`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `user_id` | `INTEGER` | NOT NULL | — | **UNIQUE, FK → users(id) ON DELETE CASCADE** |
| `role` | `app_role` | NOT NULL | `'user'` | — |

**Índice:** `idx_user_roles_user_id`

#### TABELA: `specialties`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `name` | `VARCHAR(255)` | NOT NULL | — | — |
| `description` | `TEXT` | NULL | — | — |
| `duration_minutes` | `INTEGER` | NOT NULL | `30` | — |
| `active` | `BOOLEAN` | NOT NULL | `TRUE` | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índice:** `idx_specialties_active`

#### TABELA: `professionals`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `user_id` | `INTEGER` | NULL | — | **FK → users(id) ON DELETE SET NULL** |
| `name` | `VARCHAR(255)` | NOT NULL | — | — |
| `email` | `VARCHAR(255)` | NULL | — | — |
| `phone` | `VARCHAR(20)` | NULL | — | — |
| `password_temp` | `VARCHAR(255)` | NULL | — | — |
| `active` | `BOOLEAN` | NOT NULL | `TRUE` | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_professionals_user_id`, `idx_professionals_active`

#### TABELA: `professional_specialties` (N:N)
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `professional_id` | `INTEGER` | NOT NULL | — | **FK → professionals(id) ON DELETE CASCADE** |
| `specialty_id` | `INTEGER` | NOT NULL | — | **FK → specialties(id) ON DELETE CASCADE** |

**Constraint:** `UNIQUE(professional_id, specialty_id)`
**Índices:** `idx_prof_specs_professional`, `idx_prof_specs_specialty`

#### TABELA: `available_days`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `professional_id` | `INTEGER` | NOT NULL | — | **FK → professionals(id) ON DELETE CASCADE** |
| `day_of_week` | `INTEGER` | NOT NULL | — | **CHECK (0-6)**, 0=Dom, 1=Seg...6=Sáb |
| `start_time` | `TIME` | NOT NULL | — | — |
| `end_time` | `TIME` | NOT NULL | — | — |

**Índice:** `idx_available_days_professional`

#### TABELA: `blocked_days`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `professional_id` | `INTEGER` | NULL | — | **FK → professionals(id) ON DELETE CASCADE** |
| `specialty_id` | `INTEGER` | NULL | — | **FK → specialties(id) ON DELETE CASCADE** |
| `blocked_date` | `DATE` | NOT NULL | — | — |
| `reason` | `TEXT` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_blocked_days_professional`, `idx_blocked_days_date`

#### TABELA: `appointments`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `user_id` | `INTEGER` | NOT NULL | — | **FK → users(id) ON DELETE CASCADE** |
| `professional_id` | `INTEGER` | NULL | — | **FK → professionals(id) ON DELETE SET NULL** |
| `specialty_id` | `INTEGER` | NULL | — | **FK → specialties(id) ON DELETE SET NULL** |
| `appointment_date` | `DATE` | NOT NULL | — | — |
| `appointment_time` | `TIME` | NOT NULL | — | — |
| `status` | `VARCHAR(50)` | NOT NULL | `'scheduled'` | Valores: `scheduled`, `completed`, `cancelled`, `no_show` |
| `notes` | `TEXT` | NULL | — | — |
| `professional_confirmed` | `BOOLEAN` | NULL | `FALSE` | — |
| `professional_confirmed_at` | `TIMESTAMPTZ` | NULL | — | — |
| `user_confirmed` | `BOOLEAN` | NULL | `FALSE` | — |
| `user_confirmed_at` | `TIMESTAMPTZ` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_appointments_user`, `idx_appointments_professional`, `idx_appointments_date`, `idx_appointments_status`

#### TABELA: `user_specialty_blocks`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `user_id` | `INTEGER` | NOT NULL | — | **FK → users(id) ON DELETE CASCADE** |
| `specialty_id` | `INTEGER` | NOT NULL | — | **FK → specialties(id) ON DELETE CASCADE** |
| `blocked_until` | `TIMESTAMPTZ` | NULL | — | — |
| `reason` | `TEXT` | NULL | — | — |
| `created_by` | `INTEGER` | NULL | — | **FK → users(id)** |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_user_specialty_blocks_user`, `idx_user_specialty_blocks_specialty`

#### TABELA: `admin_logs`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `admin_id` | `INTEGER` | NULL | — | **FK → users(id)** |
| `action` | `VARCHAR(100)` | NOT NULL | — | — |
| `target_id` | `INTEGER` | NULL | — | — |
| `target_type` | `VARCHAR(50)` | NULL | — | — |
| `details` | `JSONB` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índices:** `idx_admin_logs_admin`, `idx_admin_logs_created`

#### TABELA: `system_settings`
| Coluna | Tipo | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `SERIAL` | NOT NULL | auto | **PRIMARY KEY** |
| `key` | `VARCHAR(100)` | NOT NULL | — | **UNIQUE** |
| `value` | `JSONB` | NOT NULL | `'{}'` | — |
| `updated_by` | `INTEGER` | NULL | — | **FK → users(id)** |
| `updated_at` | `TIMESTAMPTZ` | NULL | `NOW()` | — |

**Índice:** `idx_system_settings_key`

### 3.4 Triggers

```sql
-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em tabelas com updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.5 Queries Principais do Sistema

#### Autenticação
```sql
-- Login: buscar usuário por email
SELECT u.id, u.email, u.password_hash,
       p.id as profile_id, p.name, p.phone, p.cpf, p.setor, p.suspended_until, p.blocked, p.must_change_password,
       ur.role
FROM users u
JOIN profiles p ON p.user_id = u.id
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = $1;

-- Registro: inserir usuário + profile + role
INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id;
INSERT INTO profiles (user_id, name, email, setor) VALUES ($1, $2, $3, $4);
INSERT INTO user_roles (user_id, role) VALUES ($1, 'user');
```

#### Agendamentos
```sql
-- Buscar slots reservados para um profissional/data
SELECT appointment_time FROM appointments
WHERE professional_id = $1 AND appointment_date = $2
AND status IN ('scheduled', 'completed');

-- Criar agendamento
INSERT INTO appointments (user_id, professional_id, specialty_id, appointment_date, appointment_time, status)
VALUES ($1, $2, $3, $4, $5, 'scheduled') RETURNING *;

-- Buscar agendamentos de um profissional
SELECT a.*, p.name as user_name, p.email as user_email, s.name as specialty_name
FROM appointments a
JOIN profiles p ON p.user_id = a.user_id
LEFT JOIN specialties s ON s.id = a.specialty_id
WHERE a.professional_id = $1
ORDER BY a.appointment_date DESC, a.appointment_time;
```

#### Disponibilidade
```sql
-- Buscar disponibilidade semanal de um profissional
SELECT * FROM available_days WHERE professional_id = $1 ORDER BY day_of_week, start_time;

-- Substituir disponibilidade (delete + insert)
DELETE FROM available_days WHERE professional_id = $1;
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4);
```

#### Profissionais + Especialidades
```sql
-- Buscar profissionais com suas especialidades
SELECT p.*, array_agg(ps.specialty_id) as specialties
FROM professionals p
LEFT JOIN professional_specialties ps ON ps.professional_id = p.id
WHERE p.active = true
GROUP BY p.id;

-- Buscar profissionais por especialidade
SELECT p.* FROM professionals p
JOIN professional_specialties ps ON ps.professional_id = p.id
WHERE ps.specialty_id = $1 AND p.active = true;
```

---

## 4. ⚙️ LÓGICA DE FUNCIONALIDADES

### 4.1 Autenticação

| Ação | Endpoint | Método | Validação |
|------|----------|--------|-----------|
| Login | `/api/auth/login` | POST | Zod: email válido, senha mín. 6 chars. bcrypt.compare no backend |
| Registro | `/api/auth/register` | POST | Email unique check, bcrypt hash da senha |
| Perfil atual | `/api/auth/me` | GET | Token JWT no header `Authorization: Bearer {token}` |
| Alterar senha | `/api/auth/update-password` | POST | Verifica senha atual, valida nova (mín. 6 chars) |
| Logout | Client-side | — | Remove `auth_token` do localStorage |

**JWT Token**: Gerado no login, armazenado em `localStorage.auth_token`, enviado como `Authorization: Bearer {token}`.

**Verificações no login:**
1. Busca usuário por email
2. Compara senha com bcrypt
3. Se `profile.blocked === true` → Retorna erro (mas o frontend também verifica)
4. Retorna `{ token, user, profile, role }`

### 4.2 Fluxo de Agendamento

1. **SpecialtySelector**: Carrega especialidades ativas → filtra as que têm profissionais → verifica bloqueios do usuário em `user_specialty_blocks`
2. **DateTimeSelector**: Carrega `available_days` do profissional → gera slots de horário com base na duração → marca slots já reservados como "Reservado"
3. **Criação**: `POST /api/appointments` com `{ user_id, professional_id, specialty_id, appointment_date, appointment_time }`

**Regras de negócio:**
- 1 agendamento por mês por especialidade por usuário
- Cancelamento no dia da consulta → cria registro em `user_specialty_blocks` com `blocked_until = 60 dias`
- Horários de atendimento: 09:00-17:00 (configurável por profissional)

### 4.3 Ações do Admin sobre Usuários

| Botão | Ação | Validação |
|-------|------|-----------|
| Alterar Senha | Chama API para alterar senha do usuário | Mín. 6 chars |
| Editar | Atualiza nome, setor, role na tabela `profiles` e `user_roles` | Nome obrigatório |
| Suspender por Especialidade | Cria registro em `user_specialty_blocks` (2 meses) | Selecionar ao menos 1 especialidade |
| Bloquear Conta | Seta `profiles.blocked = true` | Confirmação via dialog |
| Desbloquear | Seta `profiles.blocked = false` | — |
| Remover Suspensão | Seta `profiles.suspended_until = null` + deleta `user_specialty_blocks` | — |

### 4.4 Ações do Profissional

| Botão | Ação | Quando |
|-------|------|--------|
| Compareceu | Seta `professional_confirmed = true`, `status = completed` | Após horário do agendamento |
| Faltou | Seta `status = no_show` | Após horário do agendamento |
| Cancelar | Seta `status = cancelled`, envia email | Agendamentos futuros |

### 4.5 Validação de Dados

**Frontend (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
```

**Backend (Express):**
- Verificação de campos obrigatórios em cada rota
- Email format regex no registro
- bcrypt para hash de senhas (salt rounds = 10)
- JWT para autenticação (middleware `authMiddleware`)
- Middleware `adminMiddleware` para rotas administrativas

---

## 5. 🧩 COMPONENTES REACT E CONSUMO DE DADOS

### 5.1 Árvore de Componentes

```
App.tsx
├── Providers:
│   ├── QueryClientProvider (React Query)
│   ├── ThemeProvider (dark/light mode)
│   ├── ThemeSettingsProvider (visibilidade do toggle)
│   ├── AuthProvider (estado de autenticação)
│   ├── AppDataProvider (cache de especialidades/profissionais)
│   └── TooltipProvider
│
├── Routes:
│   ├── /auth → Auth.tsx
│   ├── /dashboard → Dashboard.tsx
│   │   ├── role=developer → AdminDashboard(showSettings=true)
│   │   ├── role=admin → AdminDashboard(showSettings=false)
│   │   ├── role=professional → ProfessionalDashboard
│   │   └── role=user → UserDashboard
│   ├── /reset-password → ResetPassword.tsx
│   └── * → NotFound.tsx
│
├── Admin Components:
│   ├── AdminDashboard.tsx (sidebar + tab router)
│   ├── AdminAppointments.tsx (3 views: list/calendar/by-professional)
│   ├── AdminUsers.tsx (CRUD, suspensão, bloqueio)
│   ├── AdminProfessionals.tsx (CRUD, vincular especialidades)
│   ├── AdminAvailableDays.tsx (configurar disponibilidade)
│   ├── AdminBlockedDays.tsx (bloquear datas)
│   ├── AdminReports.tsx (relatórios)
│   ├── AdminSettings.tsx (toggle theme, toggle setup)
│   ├── AdminMyBooking.tsx (admin agenda para colaboradores)
│   └── AdminImportUsers.tsx (importação em massa)
│
├── User Components:
│   ├── UserDashboard.tsx (home + navigation)
│   ├── SpecialtySelector.tsx (selecionar especialidade)
│   ├── DateTimeSelector.tsx (selecionar data/hora)
│   ├── DateSelector.tsx (calendário)
│   ├── TimeSelector.tsx (slots de horário)
│   └── MyAppointments.tsx (lista de agendamentos)
│
├── Professional Components:
│   └── ProfessionalDashboard.tsx (calendário + lista)
│
├── Shared Components:
│   ├── ConditionalThemeToggle.tsx
│   ├── ForcePasswordChange.tsx
│   ├── NavLink.tsx
│   └── ThemeToggle.tsx
│
└── UI Components (shadcn/ui):
    ├── button, card, dialog, input, label, select
    ├── table, tabs, calendar, checkbox, switch
    ├── dropdown-menu, popover, toast, sonner
    ├── badge, separator, skeleton, scroll-area
    └── ... (39 componentes total)
```

### 5.2 Hooks Customizados

| Hook | Arquivo | Função | Consumo de Dados |
|------|---------|--------|------------------|
| `useAuth` | `lib/auth.tsx` | Estado de autenticação, login/logout, roles | `authApi` (API local) |
| `useAppData` | `hooks/useAppData.tsx` | Cache de especialidades e profissionais | `professionalsApi`, `specialtiesApi` |
| `useTheme` | `hooks/useTheme.tsx` | Dark/light mode toggle | localStorage |
| `useThemeSettings` | `hooks/useThemeSettings.tsx` | Visibilidade global do theme toggle | ⚠️ **Ainda usa Supabase** (precisa migrar para API local) |
| `useToast` | `hooks/use-toast.ts` | Notificações toast | — (client-side) |
| `useMobile` | `hooks/use-mobile.tsx` | Detecção de dispositivo mobile | — (client-side) |

### 5.3 API Client (`src/lib/api.ts`)

O API Client centraliza TODAS as chamadas ao backend:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

| Módulo | Métodos Principais |
|--------|-------------------|
| `authApi` | `login()`, `register()`, `logout()`, `getProfile()`, `updatePassword()` |
| `appointmentsApi` | `list()`, `getByUser()`, `getByProfessional()`, `create()`, `update()`, `cancel()`, `getBookedSlots()`, `checkExisting()` |
| `professionalsApi` | `list()`, `getAll()`, `getById()`, `getByUserId()`, `create()`, `update()`, `delete()`, `getBySpecialty()` |
| `specialtiesApi` | `list()`, `getAll()`, `getById()`, `create()`, `update()`, `delete()` |
| `availabilityApi` | `getAvailableDays()`, `setAvailableDays()`, `getBlockedDays()`, `blockDay()`, `unblockDay()`, `getAvailableSlots()`, `getBookedSlots()` |
| `profilesApi` | `list()`, `getById()`, `getByUserId()`, `getByUserIds()`, `update()`, `blockUser()`, `suspendUser()` |
| `specialtyBlocksApi` | `getByUser()`, `create()`, `delete()` |
| `settingsApi` | `get()`, `getAll()`, `set()` |

### 5.4 Dependências Principais do Frontend

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "@tanstack/react-query": "^5.x",
  "tailwindcss": "^3.x",
  "tailwindcss-animate": "^1.x",
  "lucide-react": "latest",
  "date-fns": "^3.x",
  "zod": "^3.x",
  "class-variance-authority": "latest",
  "clsx": "latest",
  "tailwind-merge": "latest",
  "@radix-ui/*": "latest (shadcn/ui dependencies)",
  "recharts": "latest (para relatórios)"
}
```

### 5.5 Dependências do Backend

```json
{
  "express": "^4.x",
  "pg": "^8.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

---

## 6. ⚠️ COMPONENTES QUE AINDA USAM SUPABASE (PRECISAM MIGRAR)

Os seguintes componentes ainda importam `supabase` diretamente e **DEVEM** ser migrados para usar o API client local (`src/lib/api.ts`):

| Componente | Problema |
|-----------|---------|
| `AdminUsers.tsx` | Usa `supabase.from(...)` para profiles, user_roles, user_specialty_blocks |
| `AdminSettings.tsx` | Usa `supabase.from('system_settings')` |
| `AdminProfessionals.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminAppointments.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminBlockedDays.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminAvailableDays.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminReports.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminMyBooking.tsx` | Provavelmente usa `supabase` (verificar) |
| `AdminImportUsers.tsx` | Usa `supabase.functions.invoke` |
| `useThemeSettings.tsx` | Usa `supabase.from('system_settings')` |
| `emailService.ts` | Provavelmente usa Supabase functions |

**Ação necessária**: Substituir todas as chamadas `supabase.from(...)` e `supabase.functions.invoke(...)` por chamadas equivalentes usando os módulos do `api.ts`.

---

## 7. 📦 SQL COMPLETO PARA EXECUTAR NO DBEAVER

> **IMPORTANTE**: Copie o conteúdo abaixo e execute no DBeaver conectado ao PostgreSQL local.
> Primeiro crie o banco `qvtagendamento` manualmente, depois execute este script.

O SQL completo está no arquivo: **`server/database/setup.sql`**

Ele contém:
1. DROP de tabelas existentes (para reinstalação limpa)
2. Criação do tipo ENUM `app_role`
3. Criação de todas as 11 tabelas com constraints e índices
4. Triggers para `updated_at`
5. Dados iniciais (especialidades, profissionais, usuários de teste)
6. Configurações do sistema

**Usuários de teste após executar o SQL:**

| Role | Email | Senha | Notas |
|------|-------|-------|-------|
| Admin | `admin@anadem.com.br` | `123456` | Acesso total exceto Settings |
| Professional | `adilio@anadem.com.br` | `123456` | Vinculado ao Dr. Adílio (profissionais.id=1) |
| User | `joao@anadem.com.br` | `123456` | Usuário comum para testar agendamento |
| Developer | `dev@anadem.com.br` | `123456` | Acesso total + Settings |

---

## 8. 🚀 COMO RODAR O PROJETO

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (instalado e rodando)
- DBeaver (para gerenciar o banco)

### Passo 1: Criar o banco no DBeaver
```sql
CREATE DATABASE qvtagendamento;
```

### Passo 2: Executar o SQL de setup
Abra o arquivo `server/database/setup.sql` no DBeaver e execute.

### Passo 3: Configurar variáveis de ambiente

**Backend** (`server/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
PORT=3001
JWT_SECRET=sua_chave_jwt_secreta_aqui
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

### Passo 4: Instalar e rodar

```bash
# Backend
cd server
npm install
npm start  # Roda na porta 3001

# Frontend (outro terminal)
cd frontend  # ou diretório raiz
npm install
npm run dev  # Roda na porta 8080 ou 5173
```

### Passo 5: Acessar
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3001/api`
- Health check: `http://localhost:3001/api/health`

---

## 9. 📝 ENDPOINTS DA API REST

### Auth
| Método | Endpoint | Body/Params | Resposta |
|--------|----------|-------------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user, profile, role }` |
| POST | `/api/auth/register` | `{ email, password, name, setor }` | `{ message, user }` |
| GET | `/api/auth/me` | Header: `Authorization: Bearer {token}` | `{ user, profile, role }` |
| POST | `/api/auth/update-password` | `{ currentPassword, newPassword }` | `{ message }` |

### Appointments
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/appointments` | Listar (filtros: status, date, professional_id) |
| GET | `/api/appointments/user/:userId` | Por usuário |
| GET | `/api/appointments/professional/:professionalId` | Por profissional |
| GET | `/api/appointments/booked-slots?professional_id=X&date=Y` | Slots reservados |
| GET | `/api/appointments/check-existing?user_id&specialty_id&start_date&end_date` | Verificar existente |
| POST | `/api/appointments` | Criar agendamento |
| PUT | `/api/appointments/:id` | Atualizar |
| POST | `/api/appointments/:id/cancel` | Cancelar |

### Professionals
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/professionals` | Listar (filtro: ?active=true) |
| GET | `/api/professionals/:id` | Por ID |
| GET | `/api/professionals/user/:userId` | Por user_id |
| GET | `/api/professionals/by-specialty/:specialtyId` | Por especialidade |
| POST | `/api/professionals` | Criar |
| PUT | `/api/professionals/:id` | Atualizar |
| DELETE | `/api/professionals/:id` | Desativar (soft delete) |

### Specialties
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/specialties` | Listar (filtro: ?active=true) |
| GET | `/api/specialties/:id` | Por ID |
| POST | `/api/specialties` | Criar (admin) |
| PUT | `/api/specialties/:id` | Atualizar (admin) |
| DELETE | `/api/specialties/:id` | Desativar (admin) |

### Availability
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/availability/professional/:id` | Disponibilidade do profissional |
| GET | `/api/availability/professional/:id/days` | Dias disponíveis |
| POST | `/api/availability/professional/:id/days` | Configurar disponibilidade |
| GET | `/api/availability/blocked` | Dias bloqueados |
| POST | `/api/availability/blocked` | Bloquear dia |
| DELETE | `/api/availability/blocked/:id` | Desbloquear |
| GET | `/api/availability/slots?professional_id&date&duration` | Gerar slots |
| GET | `/api/availability/booked-slots?professional_id&date` | Slots ocupados |

### Profiles
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/profiles` | Listar todos (admin) |
| GET | `/api/profiles/:id` | Por ID |
| GET | `/api/profiles/user/:userId` | Por user_id |
| GET | `/api/profiles/by-users?user_ids=1&user_ids=2` | Por múltiplos user_ids |
| PUT | `/api/profiles/:id` | Atualizar |
| POST | `/api/profiles/:userId/block` | Bloquear/desbloquear |
| POST | `/api/profiles/:userId/suspend` | Suspender |

### Specialty Blocks
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/specialty-blocks/user/:userId` | Bloqueios do usuário |
| POST | `/api/specialty-blocks` | Criar bloqueio |
| DELETE | `/api/specialty-blocks/:id` | Remover bloqueio |

### Settings
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/settings` | Listar todas |
| GET | `/api/settings/:key` | Por chave |
| PUT | `/api/settings/:key` | Atualizar |

---

*Documento gerado em 13/02/2026 — Sistema de Agendamento Anadem v2.0 (Local)*
