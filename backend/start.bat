@echo off
echo 🚀 Iniciando Backend...
echo.

REM Verificar se ambiente virtual existe
if not exist "venv" (
    echo 📦 Criando ambiente virtual Python...
    python -m venv venv
)

REM Ativar ambiente virtual
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate

REM Instalar dependências
if not exist "venv\.dependencies_installed" (
    echo 📥 Instalando dependências...
    pip install -r requirements.txt -q
    type nul > venv\.dependencies_installed
)

REM Verificar se banco existe
if not exist "qvtagendamento.db" (
    echo 🗄️  Inicializando banco de dados...
    python init_db.py
)

REM Iniciar servidor
echo.
echo ✅ Backend rodando em: http://localhost:8001
echo 📚 API Docs: http://localhost:8001/docs
echo.
python server.py
