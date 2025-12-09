# Tutorial: Gerenciamento Manual do Banco de Dados

Este tutorial explica como realizar operações manuais no banco de dados do sistema de agendamentos.

---

## 📋 Índice

1. [Adicionar uma Nova Especialidade](#1-adicionar-uma-nova-especialidade)
2. [Adicionar um Novo Usuário](#2-adicionar-um-novo-usuário)
3. [Alterar o Papel de um Usuário para Administrador](#3-alterar-o-papel-de-um-usuário-para-administrador)
4. [Vincular um Profissional a uma Especialidade](#4-vincular-um-profissional-a-uma-especialidade)
5. [Configurar Dias Disponíveis para um Profissional](#5-configurar-dias-disponíveis-para-um-profissional)

---

## 1. Adicionar uma Nova Especialidade

### Passo a Passo

1. Acesse o painel do Lovable Cloud (aba "Cloud" no editor)
2. Vá para **Database → Tables → specialties**
3. Clique em **Insert Row**

### Campos a Preencher

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `name` | Nome da especialidade | "Fisioterapeuta" |
| `description` | Descrição do serviço | "Tratamento fisioterapêutico" |
| `duration_minutes` | Duração em minutos | 45 |
| `active` | Se está ativo | true |

### SQL Equivalente

```sql
INSERT INTO specialties (name, description, duration_minutes, active)
VALUES ('Fisioterapeuta', 'Tratamento fisioterapêutico', 45, true);
```

---

## 2. Adicionar um Novo Usuário

### ⚠️ Importante

A criação de usuários envolve **três tabelas**:
1. `auth.users` - Credenciais de login (gerenciado pelo sistema de autenticação)
2. `profiles` - Dados do perfil
3. `user_roles` - Papel do usuário (user, professional, admin)

### Opção A: Via Interface (Recomendado)

1. O usuário se registra pela tela de login do sistema
2. Um trigger automático cria o perfil e atribui o papel "user"

### Opção B: Via Edge Function

Chame a edge function `setup-initial-users` que cria os usuários programaticamente.

### Opção C: Via SQL (Apenas para Profissionais/Admins)

Após o usuário se registrar normalmente, atualize seu perfil:

```sql
-- 1. Primeiro, encontre o user_id do usuário
SELECT user_id, email, name FROM profiles WHERE email = 'novo.usuario@email.com';

-- 2. Atualize o perfil se necessário
UPDATE profiles 
SET 
  name = 'Nome Completo',
  setor = 'Departamento'
WHERE email = 'novo.usuario@email.com';
```

---

## 3. Alterar o Papel de um Usuário para Administrador

### Passo a Passo

1. Acesse o painel do Lovable Cloud
2. Vá para **Database → Tables → user_roles**
3. Encontre o registro do usuário pelo `user_id`
4. Edite o campo `role` para `admin`

### SQL Equivalente

```sql
-- 1. Primeiro, encontre o user_id do usuário
SELECT p.user_id, p.email, p.name, ur.role 
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'usuario@email.com';

-- 2. Atualize o papel para admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = 'UUID_DO_USUARIO_AQUI';
```

### Papéis Disponíveis

| Papel | Descrição |
|-------|-----------|
| `user` | Usuário comum - pode agendar consultas |
| `professional` | Profissional - pode ver seus agendamentos |
| `admin` | Administrador - acesso total ao sistema |

---

## 4. Vincular um Profissional a uma Especialidade

### Pré-requisitos

1. O usuário deve existir com papel `professional`
2. A especialidade deve existir na tabela `specialties`
3. O profissional deve existir na tabela `professionals`

### Passo a Passo

1. Acesse **Database → Tables → professional_specialties**
2. Clique em **Insert Row**
3. Preencha `professional_id` e `specialty_id`

### SQL Equivalente

```sql
-- 1. Encontre o ID do profissional
SELECT id, name, email FROM professionals WHERE email = 'profissional@email.com';

-- 2. Encontre o ID da especialidade
SELECT id, name FROM specialties WHERE name = 'Massagem';

-- 3. Crie o vínculo
INSERT INTO professional_specialties (professional_id, specialty_id)
VALUES ('UUID_PROFISSIONAL', 'UUID_ESPECIALIDADE');
```

---

## 5. Configurar Dias Disponíveis para um Profissional

### Passo a Passo

1. Acesse **Database → Tables → available_days**
2. Clique em **Insert Row** para cada dia

### Campos

| Campo | Descrição | Valores |
|-------|-----------|---------|
| `professional_id` | ID do profissional | UUID |
| `day_of_week` | Dia da semana | 0=Domingo, 1=Segunda, ..., 6=Sábado |
| `start_time` | Hora de início | "08:00" |
| `end_time` | Hora de término | "18:00" |

### SQL Equivalente

```sql
-- Configurar Segunda a Sexta, 8h às 18h
INSERT INTO available_days (professional_id, day_of_week, start_time, end_time)
VALUES 
  ('UUID_PROFISSIONAL', 1, '08:00', '18:00'),  -- Segunda
  ('UUID_PROFISSIONAL', 2, '08:00', '18:00'),  -- Terça
  ('UUID_PROFISSIONAL', 3, '08:00', '18:00'),  -- Quarta
  ('UUID_PROFISSIONAL', 4, '08:00', '18:00'),  -- Quinta
  ('UUID_PROFISSIONAL', 5, '08:00', '18:00');  -- Sexta
```

---

## 🔧 Dicas Úteis

### Consultar Todos os Usuários com seus Papéis

```sql
SELECT 
  p.name,
  p.email,
  p.setor,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.name;
```

### Consultar Profissionais com suas Especialidades

```sql
SELECT 
  pr.name AS profissional,
  pr.email,
  s.name AS especialidade
FROM professionals pr
LEFT JOIN professional_specialties ps ON pr.id = ps.professional_id
LEFT JOIN specialties s ON ps.specialty_id = s.id
WHERE pr.active = true
ORDER BY pr.name;
```

### Verificar Agendamentos de um Usuário

```sql
SELECT 
  a.appointment_date,
  a.appointment_time,
  a.status,
  s.name AS especialidade,
  pr.name AS profissional
FROM appointments a
LEFT JOIN specialties s ON a.specialty_id = s.id
LEFT JOIN professionals pr ON a.professional_id = pr.id
WHERE a.user_id = 'UUID_DO_USUARIO'
ORDER BY a.appointment_date DESC;
```

---

## ⚠️ Avisos Importantes

1. **Nunca modifique diretamente a tabela `auth.users`** - use o sistema de autenticação
2. **Sempre use transações** para operações que envolvem múltiplas tabelas
3. **Faça backup** antes de operações em massa
4. **Teste em ambiente de desenvolvimento** antes de aplicar em produção

---

## 📞 Suporte

Em caso de dúvidas, consulte a documentação do Lovable ou entre em contato com a equipe de desenvolvimento.
