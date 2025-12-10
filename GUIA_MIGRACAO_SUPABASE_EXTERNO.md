# Guia Completo de Migração para Supabase Externo

Este guia detalha o processo de migração do Lovable Cloud para um projeto Supabase externo.

---

## 📋 Índice

1. [Preparação](#1-preparação)
2. [Criar Projeto Supabase](#2-criar-projeto-supabase)
3. [Exportar Dados do Cloud](#3-exportar-dados-do-cloud)
4. [Configurar Banco de Dados](#4-configurar-banco-de-dados)
5. [Configurar Autenticação](#5-configurar-autenticação)
6. [Migrar Edge Functions](#6-migrar-edge-functions)
7. [Criar Novo Projeto Lovable](#7-criar-novo-projeto-lovable)
8. [Conectar ao Supabase Externo](#8-conectar-ao-supabase-externo)
9. [Transferir Código](#9-transferir-código)
10. [Testes e Validação](#10-testes-e-validação)

---

## 1. Preparação

### 1.1 Backup do Código
```bash
# Clone o repositório atual
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO

# Crie um branch de backup
git checkout -b backup-pre-migracao
git push origin backup-pre-migracao
```

### 1.2 Documentar Configurações Atuais
Anote as seguintes informações do projeto atual:
- [ ] Lista de tabelas e suas estruturas
- [ ] Políticas RLS de cada tabela
- [ ] Triggers e funções do banco
- [ ] Edge functions existentes
- [ ] Secrets configurados

---

## 2. Criar Projeto Supabase

### 2.1 Criar Conta/Projeto
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Organization**: Selecione ou crie uma organização
   - **Name**: `anadem-agendamento` (ou nome desejado)
   - **Database Password**: Crie uma senha FORTE (guarde-a!)
   - **Region**: `South America (São Paulo)` - para menor latência
5. Clique em **"Create new project"**
6. Aguarde ~2 minutos para o projeto ser provisionado

### 2.2 Anotar Credenciais
Após criação, vá em **Settings > API** e anote:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbGc...`
- **service_role key**: `eyJhbGc...` (NUNCA exponha esta!)

---

## 3. Exportar Dados do Cloud

### 3.1 Exportar Estrutura (Schema)
No Lovable Cloud, vá em **Cloud > Database > Tables** e exporte cada tabela.

Ou use o SQL abaixo para recriar toda a estrutura:

```sql
-- =====================================================
-- SCHEMA COMPLETO DO SISTEMA DE AGENDAMENTO ANADEM
-- =====================================================

-- 1. ENUM PARA ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'professional', 'developer');

-- 2. TABELA: profiles
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cpf TEXT,
    setor TEXT,
    blocked BOOLEAN DEFAULT false,
    suspended_until TIMESTAMP WITH TIME ZONE,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. TABELA: user_roles
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'user'
);

-- 4. TABELA: specialties
CREATE TABLE public.specialties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. TABELA: professionals
CREATE TABLE public.professionals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password_temp TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. TABELA: professional_specialties
CREATE TABLE public.professional_specialties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    UNIQUE(professional_id, specialty_id)
);

-- 7. TABELA: available_days
CREATE TABLE public.available_days (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 8. TABELA: blocked_days
CREATE TABLE public.blocked_days (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. TABELA: appointments
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    professional_id UUID REFERENCES professionals(id),
    specialty_id UUID REFERENCES specialties(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. TABELA: user_specialty_blocks
CREATE TABLE public.user_specialty_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. TABELA: admin_logs
CREATE TABLE public.admin_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. TABELA: system_settings
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_blocked_days_professional ON blocked_days(professional_id);
CREATE INDEX idx_blocked_days_date ON blocked_days(blocked_date);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Função para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email, setor)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data ->> 'setor'
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Função para proteger role de developer
CREATE OR REPLACE FUNCTION public.protect_developer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'developer' THEN
            RAISE EXCEPTION 'Não é possível remover a role de desenvolvedor';
        END IF;
        RETURN OLD;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        IF OLD.role = 'developer' AND NEW.role != 'developer' THEN
            RAISE EXCEPTION 'Não é possível alterar a role de desenvolvedor';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em appointments
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar profile em novo usuário
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger para proteger role de developer
CREATE TRIGGER protect_developer_role_trigger
    BEFORE UPDATE OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION protect_developer_role();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_specialty_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers can view all profiles" ON profiles FOR SELECT USING (has_role(auth.uid(), 'developer'));
CREATE POLICY "Developers can update all profiles" ON profiles FOR UPDATE USING (has_role(auth.uid(), 'developer'));
CREATE POLICY "Professionals can view profiles of their clients" ON profiles FOR SELECT 
    USING (user_id IN (
        SELECT a.user_id FROM appointments a
        JOIN professionals p ON p.id = a.professional_id
        WHERE p.user_id = auth.uid()
    ));

-- USER_ROLES
CREATE POLICY "Users can view their own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'user');
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers can view all roles" ON user_roles FOR SELECT USING (has_role(auth.uid(), 'developer'));
CREATE POLICY "Developers can manage roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'developer'));

-- SPECIALTIES
CREATE POLICY "Anyone can view active specialties" ON specialties FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage specialties" ON specialties FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFESSIONALS
CREATE POLICY "Anyone can view active professionals" ON professionals FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage professionals" ON professionals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFESSIONAL_SPECIALTIES
CREATE POLICY "Anyone can view professional specialties" ON professional_specialties FOR SELECT USING (true);
CREATE POLICY "Admins can manage professional specialties" ON professional_specialties FOR ALL USING (has_role(auth.uid(), 'admin'));

-- AVAILABLE_DAYS
CREATE POLICY "Anyone can view available days" ON available_days FOR SELECT USING (true);
CREATE POLICY "Admins can manage available days" ON available_days FOR ALL USING (has_role(auth.uid(), 'admin'));

-- BLOCKED_DAYS
CREATE POLICY "Anyone can view blocked days" ON blocked_days FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocked days" ON blocked_days FOR ALL USING (has_role(auth.uid(), 'admin'));

-- APPOINTMENTS
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all appointments" ON appointments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers can view all appointments" ON appointments FOR SELECT USING (has_role(auth.uid(), 'developer'));
CREATE POLICY "Developers can manage all appointments" ON appointments FOR ALL USING (has_role(auth.uid(), 'developer'));
CREATE POLICY "Professionals can view their own appointments" ON appointments FOR SELECT 
    USING (professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));
CREATE POLICY "Professionals can update their own appointments" ON appointments FOR UPDATE 
    USING (professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid()));

-- USER_SPECIALTY_BLOCKS
CREATE POLICY "Users can view their own blocks" ON user_specialty_blocks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own specialty blocks" ON user_specialty_blocks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage specialty blocks" ON user_specialty_blocks FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Developers can manage specialty blocks" ON user_specialty_blocks FOR ALL USING (has_role(auth.uid(), 'developer'));

-- ADMIN_LOGS
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create logs" ON admin_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- SYSTEM_SETTINGS
CREATE POLICY "Anyone can view settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins and developers can manage settings" ON system_settings FOR ALL 
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'))
    WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));
```

### 3.2 Exportar Dados
No Lovable Cloud, exporte cada tabela como CSV/XLSX:
1. Vá em **Cloud > Database > Tables**
2. Selecione cada tabela
3. Clique no botão de exportar
4. Salve os arquivos

---

## 4. Configurar Banco de Dados

### 4.1 Executar Schema
1. No Supabase Dashboard, vá em **SQL Editor**
2. Cole o SQL completo da seção 3.1
3. Clique em **Run**
4. Verifique se não há erros

### 4.2 Importar Dados
1. Vá em **Table Editor**
2. Selecione cada tabela
3. Clique em **Insert > Import data from CSV**
4. Faça upload dos arquivos exportados

**Ordem de importação (respeitar dependências):**
1. `specialties`
2. `professionals`
3. `professional_specialties`
4. `available_days`
5. `blocked_days`
6. `system_settings`

> ⚠️ **Nota**: Os dados de `profiles`, `user_roles`, e `appointments` são vinculados a usuários. Você precisará recriar os usuários primeiro.

---

## 5. Configurar Autenticação

### 5.1 Configurações Gerais
1. Vá em **Authentication > Providers**
2. Verifique que **Email** está habilitado
3. Configure:
   - ✅ Enable Email Signup
   - ❌ Double confirm email changes (desabilitar para simplificar)

### 5.2 Desabilitar Confirmação de Email (Desenvolvimento)
1. Vá em **Authentication > Providers > Email**
2. Desabilite **Confirm email**

### 5.3 Habilitar Proteção de Senha Vazada (O MOTIVO DA MIGRAÇÃO!)
1. Vá em **Authentication > Settings**
2. Procure **"Leaked password protection"**
3. Habilite a opção
4. Salve

### 5.4 Recriar Usuários
Os usuários precisam ser recriados. Você tem duas opções:

**Opção A - Via Dashboard:**
1. Vá em **Authentication > Users**
2. Clique em **Add user > Create new user**
3. Crie cada usuário manualmente

**Opção B - Via SQL (recomendado para muitos usuários):**
```sql
-- Exemplo: criar usuário admin
-- Você precisará fazer isso via API/código, não SQL direto
```

---

## 6. Migrar Edge Functions

### 6.1 Instalar Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell como Admin)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

### 6.2 Fazer Login
```bash
supabase login
```

### 6.3 Vincular ao Projeto
```bash
cd seu-projeto
supabase link --project-ref SEU_PROJECT_ID
```

### 6.4 Copiar Edge Functions
Copie a pasta `supabase/functions` do projeto atual para o novo projeto.

### 6.5 Configurar Secrets
```bash
# Para cada secret necessário:
supabase secrets set SMTP_HOST=seu_host
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=seu_usuario
supabase secrets set SMTP_PASS=sua_senha
supabase secrets set SMTP_FROM=email@dominio.com
```

### 6.6 Deploy das Functions
```bash
supabase functions deploy
```

---

## 7. Criar Novo Projeto Lovable

### 7.1 Criar Projeto
1. Acesse [https://lovable.dev](https://lovable.dev)
2. Clique em **"New Project"**
3. **IMPORTANTE**: NÃO selecione Lovable Cloud
4. Escolha **"Connect to Supabase"** quando perguntado

### 7.2 Conectar ao Supabase
1. Na tela de conexão, insira:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Sua chave pública
2. Clique em **"Connect"**

---

## 8. Conectar ao Supabase Externo

### 8.1 Verificar Conexão
Após conectar, o Lovable deve:
- Reconhecer as tabelas existentes
- Gerar os tipos TypeScript automaticamente

### 8.2 Atualizar Variáveis de Ambiente
O Lovable configurará automaticamente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 9. Transferir Código

### 9.1 Copiar Arquivos
Copie os seguintes diretórios/arquivos do projeto antigo:
- `src/components/`
- `src/hooks/`
- `src/lib/`
- `src/pages/`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`
- `tailwind.config.ts`
- `public/` (imagens e assets)

### 9.2 Verificar Imports
Certifique-se que todos os imports de Supabase apontam para:
```typescript
import { supabase } from "@/integrations/supabase/client";
```

### 9.3 Commit e Push
```bash
git add .
git commit -m "Migração para Supabase externo"
git push
```

---

## 10. Testes e Validação

### 10.1 Checklist de Testes

**Autenticação:**
- [ ] Login funciona
- [ ] Senha vazada é bloqueada (testar com senha conhecida como "123456")
- [ ] Troca de senha obrigatória funciona
- [ ] Logout funciona

**Usuários:**
- [ ] Admin consegue ver todos usuários
- [ ] Admin consegue criar usuários
- [ ] Developer tem acesso às configurações

**Agendamentos:**
- [ ] Usuário consegue agendar
- [ ] Horários disponíveis aparecem corretamente
- [ ] Profissional vê seus agendamentos

**Emails:**
- [ ] Email de confirmação é enviado
- [ ] Email de cancelamento é enviado

---

## 📌 Notas Importantes

1. **Backup**: Mantenha backup do projeto Cloud por pelo menos 30 dias
2. **DNS**: Se usar domínio customizado, atualize os registros DNS
3. **Monitoramento**: Configure alertas no Supabase Dashboard
4. **Custos**: Supabase externo tem custos separados do Lovable

---

## 🆘 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se copiou a chave correta (anon, não service_role)
- Verifique se não há espaços extras

### Erro: "RLS Policy violation"
- Verifique se as policies foram criadas corretamente
- Confirme que o usuário tem a role correta

### Edge Functions não funcionam
- Verifique os secrets com `supabase secrets list`
- Cheque logs com `supabase functions logs NOME_FUNCAO`

---

## ✅ Conclusão

Após completar todos os passos, você terá:
- ✅ Projeto Supabase externo com controle total
- ✅ Proteção de senha vazada habilitada
- ✅ Acesso ao Dashboard completo do Supabase
- ✅ Todas as funcionalidades do sistema preservadas
