@echo off
echo 🚀 Iniciando Sistema de Agendamentos Completo
echo =============================================
echo.

REM 1. Iniciar Backend
echo 📦 Iniciando Backend (FastAPI)...
cd backend

if not exist "venv" (
    echo    Criando ambiente virtual...
    python -m venv venv
)

call venv\Scripts\activate

if not exist "venv\.deps_installed" (
    echo    Instalando dependências Python...
    pip install -r requirements.txt -q
    type nul > venv\.deps_installed
)

if not exist "qvtagendamento.db" (
    echo    Inicializando banco de dados...
    python init_db.py
)

echo    Iniciando servidor backend...
start "Backend" cmd /k python server.py
echo    ✓ Backend iniciado

cd ..

REM Aguardar 3 segundos
timeout /t 3 /nobreak > nul

REM 2. Iniciar Frontend
echo.
echo 🎨 Iniciando Frontend (React)...
cd frontend

if not exist "node_modules" (
    echo    Instalando dependências Node...
    call npm install
)

echo    Iniciando servidor frontend...
start "Frontend" cmd /k npm run dev
echo    ✓ Frontend iniciado

cd ..

echo.
echo =============================================
echo ✅ Sistema Iniciado com Sucesso!
echo =============================================
echo.
echo 🌐 Acessos:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8001
echo    API Docs:  http://localhost:8001/docs
echo.
echo 🔑 Credenciais:
echo    Email: admin@anadem.com
echo    Senha: admin123
echo.
echo ⏹️  Para parar: Feche as janelas de Backend e Frontend
echo.
pause