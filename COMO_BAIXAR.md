# 📥 COMO BAIXAR O PROJETO

## 🌐 Opção 1: Via Git Clone (Recomendado)

### Se você tem Git instalado:

```bash
# 1. Abrir terminal/cmd na pasta desejada
cd C:\Projetos  # ou qualquer pasta que você quiser

# 2. Clonar o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git

# OU se estiver usando outro serviço:
git clone https://gitlab.com/seu-usuario/seu-repositorio.git
git clone https://bitbucket.org/seu-usuario/seu-repositorio.git

# 3. Entrar na pasta
cd seu-repositorio
```

### Se você NÃO tem Git instalado:

1. **Baixar Git**: https://git-scm.com/downloads
2. Instalar
3. Seguir passos acima

---

## 💾 Opção 2: Download ZIP (Mais Fácil)

### GitHub:
1. Vá para: https://github.com/seu-usuario/seu-repositorio
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Extraia o arquivo ZIP
5. Abra terminal/cmd na pasta extraída

### GitLab:
1. Vá para seu repositório no GitLab
2. Clique em **"Clone"** > **"Download"**
3. Escolha **"Download zip"**
4. Extraia e abra terminal na pasta

### Bitbucket:
1. Vá para seu repositório
2. Clique em **"..."** > **"Download repository"**
3. Extraia o ZIP
4. Abra terminal na pasta

---

## 🔄 Opção 3: Via Emergent (Se estiver usando)

1. Vá no painel Emergent
2. Clique no seu projeto
3. Clique em "Download Project" ou "Export"
4. Baixe o arquivo
5. Extraia e abra terminal na pasta

---

## 📂 Estrutura Esperada

Após baixar, você deve ter esta estrutura:

```
seu-projeto/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── ...
├── database_completo.sql         ← SQL completo
├── GUIA_INSTALACAO_COMPLETO.md   ← Guia detalhado
├── COMECAR_RAPIDO.md              ← Guia rápido
├── start-all.bat                  ← Windows
├── start-all.sh                   ← Linux/Mac
└── README.md
```

---

## ✅ Verificar se baixou corretamente

```bash
# Verificar se tem os arquivos principais
ls -la         # Linux/Mac
dir            # Windows

# Deve ver:
# - backend/
# - frontend/
# - database_completo.sql
# - start-all.bat (ou .sh)
# - README.md
```

---

## 🎯 Próximo Passo

Após baixar, siga o guia:
👉 **COMECAR_RAPIDO.md**

Ou o guia completo:
👉 **GUIA_INSTALACAO_COMPLETO.md**

---

## 💡 ATENÇÃO: Você precisa ter instalado:

Antes de começar, instale:

### ✅ Para Backend (Python):
- **Python 3.11+**: https://www.python.org/downloads/
- **PostgreSQL**: https://www.postgresql.org/download/

### ✅ Para Frontend (Node.js):
- **Node.js 18+**: https://nodejs.org/

### ✅ Verificar instalação:

```bash
# Python
python --version
# Deve mostrar: Python 3.11.x ou superior

# Node.js
node --version
# Deve mostrar: v18.x.x ou superior

# npm
npm --version

# PostgreSQL
psql --version
# Deve mostrar: psql (PostgreSQL) 15.x
```

---

## 🆘 Problemas ao Baixar?

### Erro: "git: command not found"
**Solução**: Instale o Git: https://git-scm.com/downloads

### Erro: "Repository not found"
**Solução**: 
1. Verifique se o URL está correto
2. Verifique se você tem acesso ao repositório
3. Se é privado, faça login primeiro: `git config --global user.name "Seu Nome"`

### Arquivo ZIP corrompido
**Solução**:
1. Baixe novamente
2. Use outro navegador
3. Tente o Git Clone

### Não encontrou o arquivo SQL
**Solução**:
O arquivo `database_completo.sql` deve estar na raiz do projeto. Se não estiver, ele está neste repositório e foi criado para você.

---

## 📋 Checklist Rápido

Após baixar:

- [ ] Pasta do projeto existe
- [ ] Pasta `backend/` existe
- [ ] Pasta `frontend/` existe
- [ ] Arquivo `database_completo.sql` existe
- [ ] Arquivo `start-all.bat` ou `start-all.sh` existe
- [ ] Python 3.11+ instalado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado

Se todos ✅ = Pronto para seguir com instalação!

---

## 🎯 RESUMO

1. **Baixe** o projeto (Git ou ZIP)
2. **Extraia** (se for ZIP)
3. **Abra terminal** na pasta do projeto
4. **Siga** o guia: `COMECAR_RAPIDO.md`

🚀 **Simples assim!**
