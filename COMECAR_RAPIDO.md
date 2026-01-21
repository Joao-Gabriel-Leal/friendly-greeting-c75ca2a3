# ⚡ COMEÇAR RÁPIDO - 5 PASSOS

## 1️⃣ BAIXAR
```bash
git clone <seu-repo>
cd <pasta-do-projeto>
```

## 2️⃣ BANCO DE DADOS
```sql
-- No pgAdmin ou psql:
DROP DATABASE IF EXISTS qvtagendamento;
CREATE DATABASE qvtagendamento;

-- Depois execute o arquivo:
database_completo.sql
```

**OU via linha de comando:**
```bash
psql -U postgres -d qvtagendamento -f database_completo.sql
```

## 3️⃣ CONFIGURAR
Edite `backend/.env`:
```env
DB_PASSWORD=root  # ← SUA SENHA AQUI
```

## 4️⃣ INSTALAR
```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

## 5️⃣ RODAR!
```bash
# Na pasta raiz:
start-all.bat         # Windows
./start-all.sh        # Linux/Mac
```

## 🌐 ACESSAR
**http://localhost:3000**

**Login**: admin@anadem.com / admin123

---

# 📦 O QUE VEM NO SQL?

✅ **7 Usuários** (1 admin, 3 usuários, 3 profissionais)
✅ **3 Especialidades** (Massoterapia, Psicologia, Nutrição)
✅ **3 Profissionais** (com horários configurados)
✅ **3 Agendamentos** de exemplo
✅ **Todas as tabelas** criadas
✅ **Índices** para performance

Todos com senha: **admin123**

---

# 🔑 USUÁRIOS DE TESTE

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@anadem.com | admin123 |
| Usuário | joao.silva@anadem.com | admin123 |
| Usuário | maria.santos@anadem.com | admin123 |
| Usuário | pedro.costa@anadem.com | admin123 |
| Psicóloga | dra.ana@anadem.com | admin123 |
| Massoterapeuta | dr.carlos@anadem.com | admin123 |
| Nutricionista | nutri.paula@anadem.com | admin123 |

---

# ⚠️ IMPORTANTE

❌ **NÃO rode** `python init_db.py` - Use o SQL!

✅ O SQL já cria tudo!

✅ Só precisa ajustar a senha no `backend/.env`

---

# 🎯 TESTE SE FUNCIONOU

```bash
# 1. Backend está ok?
curl http://localhost:8001/api/health

# 2. Consegue listar especialidades?
curl http://localhost:8001/api/specialties

# 3. Consegue fazer login?
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@anadem.com","password":"admin123"}'
```

Se todos retornarem sucesso = ✅ **FUNCIONANDO!**

---

# 📁 ARQUIVOS IMPORTANTES

- `database_completo.sql` ← **SQL com tudo**
- `GUIA_INSTALACAO_COMPLETO.md` ← Guia detalhado
- `start-all.bat` / `start-all.sh` ← Iniciar tudo
- `backend/.env` ← Configurar senha
- `COMANDOS_RAPIDOS.md` ← Referência rápida

---

# 🆘 PROBLEMA?

Veja: `GUIA_INSTALACAO_COMPLETO.md`
Seção: "PROBLEMAS COMUNS"

Ou teste:
1. PostgreSQL está rodando?
2. Senha está correta no `.env`?
3. SQL foi executado?
4. Dependências instaladas?

---

🎉 **PRONTO PARA USAR!**
