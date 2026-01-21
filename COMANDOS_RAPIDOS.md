# 🚀 Guia de Comandos Rápidos

## Opção 1: Iniciar Tudo de Uma Vez (MAIS FÁCIL!)

### Windows:
```bash
start-all.bat
```

### Linux/Mac:
```bash
./start-all.sh
```

Isso vai:
- ✅ Criar ambiente virtual Python (se não existir)
- ✅ Instalar todas as dependências
- ✅ Inicializar banco de dados (se não existir)
- ✅ Iniciar backend em http://localhost:8001
- ✅ Iniciar frontend em http://localhost:3000

---

## Opção 2: Iniciar Separadamente

### Backend:

**Windows:**
```bash
cd backend
start.bat
```

**Linux/Mac:**
```bash
cd backend
./start.sh
```

**Ou simplesmente:**
```bash
cd backend
npm start
# ou
python server.py
```

### Frontend:

```bash
cd frontend
npm run dev
# ou
yarn dev
```

---

## Opção 3: Comandos Tradicionais

### Backend (Python):
```bash
cd backend

# Windows
venv\Scripts\activate

# Linux/Mac  
source venv/bin/activate

pip install -r requirements.txt
python init_db.py  # primeira vez
python server.py
```

### Frontend (Node):
```bash
cd frontend
npm install  # primeira vez
npm run dev
```

---

## 🛑 Parar os Servidores

- **Frontend/Backend no terminal**: `Ctrl + C`
- **Se rodou start-all.bat**: Feche as janelas que abriram
- **Se rodou start-all.sh**: `Ctrl + C` no terminal

---

## 🔧 Comandos Úteis

```bash
# Reiniciar banco (CUIDADO: apaga dados!)
cd backend
python init_db.py

# Testar se backend está rodando
curl http://localhost:8001/api/health

# Ver dependências Python instaladas
cd backend
pip list

# Ver dependências Node instaladas
cd frontend
npm list --depth=0
```

---

## ✨ Resumo: Jeito Mais Fácil

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
chmod +x start-all.sh  # só primeira vez
./start-all.sh
```

**Acesse**: http://localhost:3000

**Login**: admin@anadem.com / admin123

🎉 **Pronto!**