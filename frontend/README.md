# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e39c2df6-06e7-4f72-b08d-d130385bfb64

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e39c2df6-06e7-4f72-b08d-d130385bfb64) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e39c2df6-06e7-4f72-b08d-d130385bfb64) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 📋 DOCUMENTAÇÃO PARA PDF

Cole o conteúdo abaixo em uma IA (como Claude.ai) para gerar um PDF completo de documentação:

---

### INFORMAÇÕES DO SISTEMA

**Nome do Projeto:** Sistema de Agendamentos Anadem  
**Objetivo:** Sistema interno de agendamento de consultas com profissionais (Massagem, Nutricionista, Psicólogo)  
**Público-alvo:** Colaboradores da empresa Anadem  
**Tecnologias:** React, TypeScript, Tailwind CSS, Supabase (Lovable Cloud)

---

### TIPOS DE USUÁRIO

O sistema possui 4 tipos de usuário com diferentes permissões:

| Tipo | Descrição |
|------|-----------|
| **Usuário** | Colaborador que agenda consultas |
| **Profissional** | Prestador de serviços (massagista, nutricionista, psicólogo) |
| **Admin** | Gerencia usuários, profissionais e agendamentos |
| **Desenvolvedor** | Acesso total + configurações do sistema |

---

### FUNCIONALIDADES POR TIPO DE USUÁRIO

#### 👤 USUÁRIO (Colaborador)

**Login:**
1. Acesse a página inicial
2. Digite email e senha
3. No primeiro acesso, será solicitada troca de senha obrigatória

**Agendar Consulta:**
1. Clique em "Novo Agendamento"
2. Selecione a especialidade desejada (Massagem, Nutricionista ou Psicólogo)
3. Escolha a data disponível no calendário
4. Selecione o horário disponível
5. Confirme o agendamento

**Visualizar Agendamentos:**
1. Clique em "Meus Agendamentos"
2. Visualize consultas agendadas, realizadas e canceladas

**Cancelar Agendamento:**
- Só é possível cancelar com mais de 24 horas de antecedência
- Cancelamentos com menos de 24h resultam em suspensão de 60 dias na especialidade

---

#### 👨‍⚕️ PROFISSIONAL

**Login:**
1. Acesse com email e senha fornecidos pelo admin

**Visualizar Agenda:**
1. Veja todos os agendamentos na visualização de calendário ou lista
2. Consulte nome do cliente, horário e especialidade

**Cancelar Atendimento:**
1. Clique no agendamento
2. Informe o motivo do cancelamento
3. O cliente e administradores serão notificados por email

---

#### 👨‍💼 ADMIN (Administrador)

**Meu Agendamento:**
- Admins podem agendar consultas para si mesmos como colaboradores

**Gerenciar Agendamentos:**
- Visualize todos os agendamentos do sistema
- Filtre por data, profissional ou status
- Cancele agendamentos quando necessário

**Gerenciar Usuários:**
1. Aba "Usuários" - Visualize e edite usuários
2. **Ações disponíveis:**
   - Alterar senha do usuário
   - Editar dados (nome, email, setor)
   - Suspender usuário de especialidade específica (até 60 dias)
   - Bloquear conta completamente

**Importar Usuários em Massa:**
1. Aba "Importar Usuários"
2. Baixe o template Excel
3. Preencha os dados dos usuários
4. Faça upload do arquivo
5. Sistema valida e cria as contas automaticamente

**Criar Usuário Individual:**
1. Na aba "Usuários", clique em "Novo Usuário"
2. Preencha: nome, email, telefone, setor
3. Senha padrão: 123456 (usuário deve trocar no primeiro acesso)

**Gerenciar Profissionais:**
1. Aba "Profissionais"
2. Crie novos profissionais com email/senha
3. Associe especialidades
4. Ative/desative profissionais

**Configurar Disponibilidade:**
1. Aba "Dias Disponíveis"
2. Configure horários disponíveis por profissional
3. Pode definir múltiplos slots de horário por data

**Bloquear Dias:**
1. Aba "Dias Bloqueados"
2. Bloqueie datas específicas para profissionais ou especialidades
3. Útil para férias, feriados, eventos

**Relatórios:**
1. Aba "Relatórios"
2. Visualize métricas: total de agendamentos, realizados, faltas, cancelamentos
3. Exporte relatórios em Excel (XLSX)

---

#### 👨‍💻 DESENVOLVEDOR

**Todas as funcionalidades do Admin, mais:**

**Configurações do Sistema:**
1. Aba "Configurações"
2. Ativar/desativar botão de tema escuro para todos os usuários
3. Controlar visibilidade do botão de configuração inicial na página de login

---

### FLUXOS PRINCIPAIS

#### Fluxo 1: Colaborador Agenda Consulta
```
Login → Novo Agendamento → Seleciona Especialidade → 
Seleciona Data → Seleciona Horário → Confirmação → 
Email de Confirmação Enviado
```

#### Fluxo 2: Admin Cria Novo Usuário
```
Login Admin → Aba Usuários → Novo Usuário → 
Preenche Dados → Salva → 
Usuário recebe credenciais (senha: 123456)
```

#### Fluxo 3: Admin Importa Usuários em Massa
```
Login Admin → Aba Importar → Download Template → 
Preenche Excel → Upload → Validação → 
Usuários Criados Automaticamente
```

#### Fluxo 4: Admin Suspende Usuário de Especialidade
```
Login Admin → Aba Usuários → Seleciona Usuário → 
Suspender por Especialidade → Seleciona Especialidade → 
Define Período (máx 60 dias) → Confirma → 
Email de Suspensão Enviado
```

---

### REGRAS DE NEGÓCIO IMPORTANTES

| Regra | Descrição |
|-------|-----------|
| **Cancelamento < 24h** | Usuário é suspenso da especialidade por 60 dias |
| **Horários Duplicados** | Sistema bloqueia agendamento em horário já ocupado |
| **Primeiro Acesso** | Senha padrão 123456, troca obrigatória |
| **Bloqueio de Conta** | Usuário não consegue logar, vê mensagem de contato |
| **Suspensão por Especialidade** | Usuário pode agendar outras especialidades |

---

### SETORES/DEPARTAMENTOS

Os setores disponíveis para classificação de usuários são:
- Expedição
- Comercial
- Jurídico
- Compras
- RH
- Controladoria
- Cirurgia Segura
- Administrativo
- TI
- Financeiro
- Presidência

---

### NOTIFICAÇÕES POR EMAIL

O sistema envia emails automáticos para:
- ✉️ Confirmação de agendamento
- ✉️ Cancelamento de agendamento
- ✉️ Lembrete 24h antes da consulta
- ✉️ Lembrete 1h antes da consulta
- ✉️ Suspensão de especialidade
- ✉️ Bloqueio de conta
- ✉️ Reativação de conta

**Nota:** Requer configuração SMTP pelo TI (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)

---

### CREDENCIAIS DE TESTE

| Tipo | Email | Senha |
|------|-------|-------|
| Desenvolvedor | desenvolvimento@anadem.com.br | 123456 |
| Admin | (criar via desenvolvedor) | 123456 |
| Usuário | (criar via admin) | 123456 |

**Nota:** Todas as senhas padrão são 123456 e devem ser trocadas no primeiro acesso.

---

### CHECKLIST DE TESTES

#### Usuário
- [ ] Login com credenciais
- [ ] Troca de senha no primeiro acesso
- [ ] Visualizar especialidades disponíveis
- [ ] Agendar consulta
- [ ] Visualizar agendamentos
- [ ] Cancelar agendamento (com +24h de antecedência)
- [ ] Verificar suspensão após cancelamento tardio

#### Admin
- [ ] Criar usuário individual
- [ ] Importar usuários via Excel
- [ ] Editar dados de usuário
- [ ] Suspender usuário de especialidade
- [ ] Bloquear conta de usuário
- [ ] Configurar disponibilidade de profissional
- [ ] Bloquear dia específico
- [ ] Gerar relatório
- [ ] Exportar relatório Excel

#### Profissional
- [ ] Visualizar agenda
- [ ] Cancelar atendimento

---

### PROMPT PARA GERAR PDF

**Copie e cole no Claude.ai:**

```
Com base nas informações acima, crie um PDF profissional e completo com:
1. Índice navegável
2. Introdução e visão geral do sistema
3. Guia completo para cada tipo de usuário (com screenshots simulados em texto)
4. Fluxos de trabalho detalhados com diagramas de texto
5. FAQ com perguntas frequentes
6. Glossário de termos
7. Checklist de validação

Formate de forma clara e profissional, adequado para usuários não-técnicos.
Use emojis para facilitar a navegação visual.
```
