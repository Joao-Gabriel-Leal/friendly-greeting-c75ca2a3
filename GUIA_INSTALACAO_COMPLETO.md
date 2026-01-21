# 🚀 GUIA COMPLETO - Rodar Sistema Localmente

## 📥 PASSO 1: Baixar o Sistema

### Opção A: Via Git (Recomendado)

```bash
# 1. Clonar repositório
git clone <URL_DO_SEU_REPOSITORIO>
cd <pasta-do-projeto>
```

### Opção B: Download Manual

1. Vá no repositório do projeto
2. Clique em "Code" > "Download ZIP"
3. Extraia o ZIP em uma pasta
4. Abra terminal/CMD nessa pasta

---

## 🗄️ PASSO 2: Configurar Banco de Dados PostgreSQL

### 2.1 Deletar e Recriar o Banco

```sql
-- Abra o pgAdmin ou psql e execute:

-- Desconectar todos
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'qvtagendamento';

-- Deletar banco antigo
DROP DATABASE IF EXISTS qvtagendamento;

-- Criar banco novo
CREATE DATABASE qvtagendamento;
```

### 2.2 Executar o SQL Completo

```bash
# Opção 1: Via psql (linha de comando)
psql -U postgres -d qvtagendamento -f database_completo.sql

# Opção 2: Via pgAdmin
# 1. Abra pgAdmin
# 2. Conecte ao banco "qvtagendamento"
# 3. Tools > Query Tool
# 4. Abra o arquivo "database_completo.sql"
# 5. Execute (F5)
```

### 2.3 Verificar se deu certo

```sql
-- Deve retornar 7 usuários
SELECT COUNT(*) FROM users;

-- Deve retornar 3 profissionais
SELECT COUNT(*) FROM professionals;

-- Ver todos os usuários criados
SELECT u.email, u.role, p.name 
FROM users u 
LEFT JOIN profiles p ON u.id = p.user_id;
```

---

## ⚙️ PASSO 3: Configurar Backend

### 3.1 Editar arquivo de configuração

Abra o arquivo `backend/.env` e configure:

```env
# Database Type: postgresql (USE POSTGRESQL!)
DB_TYPE=postgresql

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root           # ← SUA SENHA AQUI

# CORS Configuration
CORS_ORIGINS=*

# Security
SECRET_KEY=troque-esta-chave-por-uma-segura-em-producao
```

### 3.2 Instalar dependências Python

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

**❌ NÃO RODE `python init_db.py`** - Você já criou o banco pelo SQL!

---

## 🎨 PASSO 4: Configurar Frontend

### 4.1 Editar arquivo de configuração

Abra o arquivo `frontend/.env` e verifique:

```env
VITE_API_URL=http://localhost:8001/api
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### 4.2 Instalar dependências Node

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install
```

---

## 🚀 PASSO 5: RODAR O SISTEMA!

### 🌟 OPÇÃO 1: Comando Único (MAIS FÁCIL!)

Na pasta raiz do projeto:

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

### 🔧 OPÇÃO 2: Separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# ou
python server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🌐 PASSO 6: Acessar o Sistema

### URLs:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Documentação API**: http://localhost:8001/docs

### 🔑 Credenciais de Teste:

| Tipo | Email | Senha | Acesso |
|------|-------|-------|--------|
| **Administrador** | admin@anadem.com | admin123 | Total |
| **Usuário** | joao.silva@anadem.com | admin123 | Usuário |
| **Usuário** | maria.santos@anadem.com | admin123 | Usuário |
| **Profissional (Psicóloga)** | dra.ana@anadem.com | admin123 | Profissional |
| **Profissional (Massoterapeuta)** | dr.carlos@anadem.com | admin123 | Profissional |
| **Profissional (Nutricionista)** | nutri.paula@anadem.com | admin123 | Profissional |

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Marque conforme for fazendo:

- [ ] 1. Repositório clonado/baixado
- [ ] 2. PostgreSQL instalado e rodando
- [ ] 3. Banco `qvtagendamento` criado
- [ ] 4. SQL executado com sucesso
- [ ] 5. `backend/.env` configurado (senha correta!)
- [ ] 6. Dependências Python instaladas
- [ ] 7. `frontend/.env` verificado
- [ ] 8. Dependências Node instaladas
- [ ] 9. Backend rodando em :8001
- [ ] 10. Frontend rodando em :3000
- [ ] 11. Login funcionando
- [ ] 12. Consegue criar agendamento

---

## 🐛 PROBLEMAS COMUNS

### ❌ Erro: "Connection refused" no backend

**Solução:**
1. Verifique se PostgreSQL está rodando
2. Confira senha no `backend/.env`
3. Teste conexão: `psql -U postgres -d qvtagendamento`

### ❌ Erro 401 no login

**Solução:**
1. Verifique se o SQL foi executado
2. Confira se tem usuários: `SELECT * FROM users;`
3. Reinicie o backend

### ❌ Frontend não conecta no backend

**Solução:**
1. Verifique se backend está rodando: http://localhost:8001/api/health
2. Confira `VITE_API_URL` no `frontend/.env`
3. Reinicie o frontend

### ❌ "Module not found"

**Solução:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### ❌ Porta já em uso

**Solução:**
```bash
# Windows
netstat -ano | findstr :8001
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

## 📝 DADOS DE TESTE CRIADOS

O SQL já criou:

### Usuários:
- 1 Admin
- 3 Usuários comuns
- 3 Profissionais

### Profissionais:
- Dra. Ana Paula (Psicóloga)
- Dr. Carlos Eduardo (Massoterapeuta)
- Nutricionista Paula

### Especialidades:
- Massoterapia (60 min)
- Psicologia (50 min)
- Nutrição (45 min)

### Agendamentos:
- 3 agendamentos de exemplo já criados

### Disponibilidade:
- Profissionais com horários configurados
- Segunda a Sexta-feira

---

## 🎯 PRÓXIMOS PASSOS

Após tudo funcionando:

1. ✅ Testar login com diferentes usuários
2. ✅ Criar novos agendamentos
3. ✅ Testar como profissional
4. ✅ Testar como admin
5. 🔒 Trocar SECRET_KEY (produção)
6. 🎨 Personalizar conforme necessário

---

## 💻 COMANDOS RÁPIDOS

```bash
# Ver se backend está ok
curl http://localhost:8001/api/health

# Login via API (teste)
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@anadem.com","password":"admin123"}'

# Ver logs backend
cd backend
tail -f backend.log

# Reiniciar tudo
# Windows: Feche e rode start-all.bat novamente
# Linux/Mac: Ctrl+C e rode ./start-all.sh novamente
```

---

## 📞 SUPORTE

Se algo não funcionar:

1. Verifique o checklist acima
2. Veja a seção "Problemas Comuns"
3. Confira os logs do backend e frontend
4. Teste a conexão com o banco

---

## ✅ RESUMO SUPER RÁPIDO

```bash
# 1. Baixar projeto
git clone <repo>
cd <pasta>

# 2. Criar banco
psql -U postgres -c "DROP DATABASE IF EXISTS qvtagendamento;"
psql -U postgres -c "CREATE DATABASE qvtagendamento;"
psql -U postgres -d qvtagendamento -f database_completo.sql

# 3. Configurar backend/.env (senha do PostgreSQL)
# 4. Instalar dependências
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# 5. Rodar!
cd ..
start-all.bat         # Windows
./start-all.sh        # Linux/Mac

# 6. Acessar http://localhost:3000
# Login: admin@anadem.com / admin123
```

🎉 **PRONTO!**
