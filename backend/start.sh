#!/bin/bash

echo "🚀 Iniciando Backend..."
echo ""

# Verificar se ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate 2>/dev/null || venv\\Scripts\\activate

# Instalar dependências
if [ ! -f "venv/.dependencies_installed" ]; then
    echo "📥 Instalando dependências..."
    pip install -r requirements.txt -q
    touch venv/.dependencies_installed
fi

# Verificar se banco existe
if [ ! -f "qvtagendamento.db" ] && [ "$DB_TYPE" != "postgresql" ]; then
    echo "🗄️  Inicializando banco de dados..."
    python init_db.py
fi

# Iniciar servidor
echo ""
echo "✅ Backend rodando em: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
python server.py
