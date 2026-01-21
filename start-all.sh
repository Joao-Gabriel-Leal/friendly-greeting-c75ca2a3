#!/bin/bash

echo "🚀 Iniciando Sistema de Agendamentos Completo"
echo "============================================="
echo ""

# Função para verificar se porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Porta $1 já está em uso"
        return 1
    fi
    return 0
}

# 1. Verificar portas
echo "🔍 Verificando portas..."
if ! check_port 8001; then
    echo "   Backend já está rodando ou porta ocupada"
fi

if ! check_port 3000; then
    echo "   Frontend já está rodando ou porta ocupada"
fi

echo ""

# 2. Iniciar Backend
echo "📦 Iniciando Backend (FastAPI)..."
cd backend

# Verificar ambiente virtual
if [ ! -d "venv" ]; then
    echo "   Criando ambiente virtual..."
    python -m venv venv
fi

# Ativar e instalar
source venv/bin/activate
if [ ! -f "venv/.deps_installed" ]; then
    echo "   Instalando dependências Python..."
    pip install -r requirements.txt -q
    touch venv/.deps_installed
fi

# Inicializar banco se não existir
if [ ! -f "qvtagendamento.db" ]; then
    echo "   Inicializando banco de dados..."
    python init_db.py
fi

# Iniciar backend em background
echo "   Iniciando servidor backend..."
python server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✓ Backend iniciado (PID: $BACKEND_PID)"

cd ..

# 3. Aguardar backend ficar pronto
echo ""
echo "⏳ Aguardando backend ficar pronto..."
for i in {1..10}; do
    if curl -s http://localhost:8001/api/health > /dev/null 2>&1; then
        echo "   ✓ Backend respondendo!"
        break
    fi
    sleep 1
done

echo ""

# 4. Iniciar Frontend
echo "🎨 Iniciando Frontend (React)..."
cd frontend

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências Node..."
    npm install
fi

# Iniciar frontend
echo "   Iniciando servidor frontend..."
npm run dev &
FRONTEND_PID=$!
echo "   ✓ Frontend iniciado (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "============================================="
echo "✅ Sistema Iniciado com Sucesso!"
echo "============================================="
echo ""
echo "🌐 Acessos:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8001"
echo "   API Docs:  http://localhost:8001/docs"
echo ""
echo "🔑 Credenciais:"
echo "   Email: admin@anadem.com"
echo "   Senha: admin123"
echo ""
echo "📝 Logs:"
echo "   Backend: /tmp/backend.log"
echo "   Frontend: Neste terminal"
echo ""
echo "⏹️  Para parar:"
echo "   Ctrl+C ou execute: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Manter script rodando
wait