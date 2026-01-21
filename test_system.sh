#!/bin/bash

echo "🧪 Testando Sistema de Agendamentos"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo -n "Testando $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt -X "$method" -H "Content-Type: application/json" "$url")
    fi
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FALHOU (HTTP $response)${NC}"
        return 1
    fi
}

echo "1. Testando Backend"
echo "-------------------"

# Verificar se backend está rodando
if ! pgrep -f "python.*server.py" > /dev/null; then
    echo -e "${RED}✗ Backend não está rodando!${NC}"
    echo "  Execute: cd backend && python server.py"
    exit 1
fi

test_endpoint "Health Check" "http://localhost:8001/api/health"
test_endpoint "Root" "http://localhost:8001/api"
test_endpoint "Especialidades" "http://localhost:8001/api/specialties"
test_endpoint "Profissionais" "http://localhost:8001/api/professionals"

echo ""
echo "2. Testando Autenticação"
echo "------------------------"

# Fazer login
login_response=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@anadem.com","password":"admin123"}')

token=$(echo $login_response | python -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$token" ]; then
    echo -e "${GREEN}✓ Login bem-sucedido${NC}"
    echo "  Token gerado: ${token:0:20}..."
    
    # Testar endpoint autenticado
    echo -n "Testando /api/auth/me... "
    me_response=$(curl -s -H "Authorization: Bearer $token" http://localhost:8001/api/auth/me)
    if echo $me_response | grep -q "admin@anadem.com"; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FALHOU${NC}"
    fi
else
    echo -e "${RED}✗ Falha no login${NC}"
fi

echo ""
echo "3. Testando Banco de Dados"
echo "--------------------------"

if [ -f "/app/backend/qvtagendamento.db" ]; then
    echo -e "${GREEN}✓ Banco SQLite encontrado${NC}"
    
    # Contar registros
    users=$(sqlite3 /app/backend/qvtagendamento.db "SELECT COUNT(*) FROM users;" 2>/dev/null)
    specialties=$(sqlite3 /app/backend/qvtagendamento.db "SELECT COUNT(*) FROM specialties;" 2>/dev/null)
    
    echo "  Usuários cadastrados: $users"
    echo "  Especialidades: $specialties"
else
    echo -e "${YELLOW}⚠ Banco SQLite não encontrado (pode estar usando PostgreSQL)${NC}"
fi

echo ""
echo "4. Verificando Frontend"
echo "----------------------"

if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✓ Frontend está rodando${NC}"
    
    # Verificar se responde
    if curl -s -I http://localhost:3000 | grep -q "200"; then
        echo -e "${GREEN}✓ Frontend acessível em http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend pode não estar respondendo${NC}"
    fi
else
    echo -e "${RED}✗ Frontend não está rodando${NC}"
    echo "  Execute: cd frontend && npm run dev"
fi

echo ""
echo "===================================="
echo "✅ Testes concluídos!"
echo ""
echo "📝 Credenciais de teste:"
echo "   Email: admin@anadem.com"
echo "   Senha: admin123"
echo ""
echo "🌐 Acessos:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
