# 📅 Sistema de Agendamentos - Anadem

Sistema completo de agendamentos com autenticação, gestão de profissionais, especialidades e agendamentos.

---

## 🚀 COMEÇAR AGORA

### 📖 Guias Disponíveis:

1. **[⚡ COMEÇAR RÁPIDO](COMECAR_RAPIDO.md)** ← **COMECE AQUI!**
   - 5 passos simples
   - Mais rápido para iniciar

2. **[📥 Como Baixar o Projeto](COMO_BAIXAR.md)**
   - Git Clone ou Download ZIP
   - Verificação de instalação

3. **[📚 Guia Completo de Instalação](GUIA_INSTALACAO_COMPLETO.md)**
   - Passo a passo detalhado
   - Troubleshooting completo

4. **[💻 Comandos Rápidos](COMANDOS_RAPIDOS.md)**
   - Referência rápida de comandos
   - Diferentes formas de rodar

5. **[❓ Por que não é mais npm start?](POR_QUE_NAO_NPM_START.md)**
   - Explicação sobre Python vs Node
   - Comparações e vantagens

---

## 🗄️ Banco de Dados

- **[database_completo.sql](database_completo.sql)** - SQL completo com dados de teste
- **[verificar_banco.sql](verificar_banco.sql)** - Script de verificação

---

## 🎯 Para Impacie ntes (TL;DR)

```bash
# 1. Baixar
git clone <repo> && cd <pasta>

# 2. Banco
psql -U postgres -d qvtagendamento -f database_completo.sql

# 3. Configurar backend/.env (senha do PostgreSQL)

# 4. Instalar
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# 5. Rodar
cd .. && start-all.bat  # Windows
cd .. && ./start-all.sh # Linux/Mac

# 6. Acessar http://localhost:3000
# Login: admin@anadem.com / admin123
```

---

## 🏗️ Arquitetura

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL/SQLite
- **Autenticação**: JWT (JSON Web Tokens)

## 📋 Pré-requisitos

### Para rodar localmente:

- **Node.js** 18+ e **npm** ou **yarn**
- **Python** 3.11+
- **PostgreSQL** (opcional - pode usar SQLite para desenvolvimento)

## 🚀 Instalação e Execução Local

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd <pasta-do-projeto>
```

### 2. Configurar Backend

```bash
cd backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configurar Banco de Dados

Edite o arquivo `backend/.env`:

**Opção 1 - SQLite (Desenvolvimento - Mais fácil)**
```env
DB_TYPE=sqlite
CORS_ORIGINS=*
SECRET_KEY=sua-chave-secreta-aqui
```

**Opção 2 - PostgreSQL (Produção - Seu banco local)**
```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
CORS_ORIGINS=*
SECRET_KEY=sua-chave-secreta-aqui
```

### 4. Inicializar Banco de Dados

```bash
# Ainda na pasta backend/
python init_db.py
```

Isso vai criar:
- ✅ Todas as tabelas necessárias
- ✅ Usuário admin: `admin@anadem.com` / `admin123`
- ✅ 3 especialidades básicas (Massoterapia, Psicologia, Nutrição)

### 5. Rodar Backend

```bash
# Na pasta backend/
python server.py
```

O backend vai rodar em: `http://localhost:8001`

### 6. Configurar Frontend

Abra **OUTRO terminal** e execute:

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install
```

Edite o arquivo `frontend/.env`:

```env
VITE_API_URL=http://localhost:8001/api
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 7. Rodar Frontend

```bash
# Na pasta frontend/
npm run dev
# ou
yarn dev
```

O frontend vai rodar em: `http://localhost:3000`

## 🔑 Credenciais Padrão

Após executar `init_db.py`:

- **Email**: `admin@anadem.com`
- **Senha**: `admin123`
- **Role**: Administrador

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py           # Servidor FastAPI principal
│   ├── database.py         # Configuração do banco
│   ├── models.py           # Modelos SQLAlchemy
│   ├── auth.py             # Autenticação JWT
│   ├── init_db.py          # Script de inicialização
│   ├── requirements.txt    # Dependências Python
│   ├── .env                # Variáveis de ambiente
│   └── routers/
│       ├── auth_router.py
│       ├── appointments_router.py
│       ├── professionals_router.py
│       ├── specialties_router.py
│       ├── availability_router.py
│       ├── profiles_router.py
│       ├── settings_router.py
│       └── specialty_blocks_router.py
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes React
    │   ├── pages/           # Páginas
    │   ├── lib/             # Bibliotecas (API, auth, etc)
    │   └── hooks/           # Custom hooks
    ├── package.json
    ├── vite.config.ts
    └── .env
```

## 🗄️ Banco de Dados

### Tabelas Criadas:

- `users` - Usuários do sistema
- `profiles` - Perfis dos usuários
- `specialties` - Especialidades (Massoterapia, Psicologia, etc)
- `professionals` - Profissionais cadastrados
- `professional_specialties` - Relação profissionais↔especialidades
- `appointments` - Agendamentos
- `available_days` - Dias disponíveis dos profissionais
- `blocked_days` - Dias bloqueados
- `specialty_blocks` - Bloqueios de especialidade por usuário
- `system_settings` - Configurações do sistema

## 🔧 Comandos Úteis

### Backend

```bash
# Rodar servidor de desenvolvimento
python server.py

# Reiniciar banco (CUIDADO: apaga todos os dados!)
rm qvtagendamento.db  # Se usar SQLite
python init_db.py

# Verificar logs
tail -f /var/log/supervisor/backend.err.log
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Perfil atual
- `POST /api/auth/update-password` - Atualizar senha

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/{id}` - Atualizar agendamento
- `POST /api/appointments/{id}/cancel` - Cancelar agendamento

### Profissionais
- `GET /api/professionals` - Listar profissionais
- `POST /api/professionals` - Criar profissional
- `PUT /api/professionals/{id}` - Atualizar profissional
- `DELETE /api/professionals/{id}` - Deletar profissional

### Especialidades
- `GET /api/specialties` - Listar especialidades
- `POST /api/specialties` - Criar especialidade
- `PUT /api/specialties/{id}` - Atualizar especialidade

### Disponibilidade
- `GET /api/availability/professional/{id}/days` - Dias disponíveis
- `POST /api/availability/professional/{id}/days` - Configurar dias
- `GET /api/availability/slots` - Horários disponíveis
- `POST /api/availability/blocked` - Bloquear dia

[E mais endpoints...]

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ CORS configurável
- ✅ Proteção contra SQL Injection (SQLAlchemy)
- ⚠️ **IMPORTANTE**: Troque a `SECRET_KEY` no `.env` para produção!

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no `.env`
3. Teste conexão: `psql -h localhost -U postgres -d qvtagendamento`

### Frontend não conecta no backend
1. Verifique se backend está rodando: `curl http://localhost:8001/api/health`
2. Confirme o `VITE_API_URL` no `frontend/.env`
3. Verifique CORS no backend

### Erro "Module not found"
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

## 📝 Notas Importantes

1. **SQLite vs PostgreSQL**:
   - SQLite: Ideal para desenvolvimento, não precisa instalar nada
   - PostgreSQL: Recomendado para produção, melhor performance

2. **Trocar de SQLite para PostgreSQL**:
   - Edite `backend/.env` e mude `DB_TYPE=postgresql`
   - Configure as credenciais do PostgreSQL
   - Rode `python init_db.py` novamente

3. **Dados de exemplo**:
   - O script `init_db.py` cria apenas 1 admin e 3 especialidades
   - Você pode criar mais dados via interface ou diretamente no banco

4. **Backup**:
   - SQLite: Copie o arquivo `qvtagendamento.db`
   - PostgreSQL: Use `pg_dump`

## 🤝 Contribuindo

1. Faça um fork
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário da Anadem.

---

**Desenvolvido com ❤️ para Anadem**
