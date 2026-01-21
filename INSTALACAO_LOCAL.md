# 🚀 Guia Rápido de Instalação Local

## Passo a Passo Simples

### 1️⃣ Baixar o Projeto

```bash
git clone <seu-repo>
cd <pasta-do-projeto>
```

### 2️⃣ Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate
# OU (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar .env de exemplo
cp .env.example .env

# Inicializar banco
python init_db.py

# Rodar servidor
python server.py
```

✅ Backend rodando em: http://localhost:8001

### 3️⃣ Frontend (em outro terminal)

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install

# Copiar .env de exemplo
cp .env.example .env

# Rodar desenvolvimento
npm run dev
# ou
yarn dev
```

✅ Frontend rodando em: http://localhost:3000

### 4️⃣ Acessar o Sistema

1. Abra o navegador em: http://localhost:3000
2. Faça login com:
   - **Email**: admin@anadem.com
   - **Senha**: admin123

## 🔄 Trocar para seu PostgreSQL Local

Edite `backend/.env`:

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root  # ← sua senha aqui
```

Depois rode:

```bash
cd backend
python init_db.py
python server.py
```

## ❓ Problemas?

### Backend não inicia
- Verifique se Python 3.11+ está instalado: `python --version`
- Ative o ambiente virtual
- Reinstale dependências: `pip install -r requirements.txt`

### Frontend não inicia
- Verifique se Node.js está instalado: `node --version`
- Delete `node_modules` e rode `npm install` novamente
- Limpe cache: `npm cache clean --force`

### Erro de conexão
- Verifique se backend está rodando: http://localhost:8001/api/health
- Confira o arquivo `frontend/.env`
- Verifique o firewall

---

**Pronto! Sistema rodando localmente! 🎉**