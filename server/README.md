# Sistema de Agendamento - PostgreSQL Local

## Estrutura Criada

```
server/
├── config/
│   └── database.js       # Conexão PostgreSQL
├── middleware/
│   └── auth.js           # JWT e autorizações
├── routes/
│   ├── auth.js           # Login/Signup
│   ├── appointments.js   # Agendamentos
│   ├── professionals.js  # Profissionais
│   ├── specialties.js    # Especialidades
│   ├── availability.js   # Disponibilidade
│   ├── profiles.js       # Perfis
│   └── settings.js       # Configurações
├── database/
│   └── setup.sql         # Script SQL completo
├── index.js              # Servidor Express
├── package.json
└── .env.example
```

## Configuração do Banco de Dados

1. Crie o banco no PostgreSQL:
```sql
CREATE DATABASE qvtagendamento;
```

2. Execute o script SQL:
```bash
psql -U postgres -d qvtagendamento -f server/database/setup.sql
```

## Configuração do Backend

1. Entre na pasta server:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env`:
```bash
cp .env.example .env
```

4. Configure o `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qvtagendamento
DB_USER=postgres
DB_PASSWORD=root
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui
```

5. Inicie o servidor:
```bash
npm start
# ou para desenvolvimento:
npm run dev
```

## Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@anadem.com.br | 123456 |
| Profissional | adilio@anadem.com.br | 123456 |
| Usuário | joao@anadem.com.br | 123456 |
| Developer | dev@anadem.com.br | 123456 |

## API Endpoints

### Autenticação
- `POST /api/auth/signup` - Cadastro
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Dados do usuário
- `POST /api/auth/change-password` - Alterar senha

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar
- `DELETE /api/appointments/:id` - Cancelar
- `GET /api/appointments/booked-slots` - Horários ocupados

### Profissionais
- `GET /api/professionals` - Listar ativos
- `GET /api/professionals/all` - Listar todos (admin)
- `POST /api/professionals` - Criar (admin)
- `PUT /api/professionals/:id` - Atualizar (admin)

### Especialidades
- `GET /api/specialties` - Listar ativas
- `GET /api/specialties/professional-specialties` - Relações

### Disponibilidade
- `GET /api/availability/days/:professionalId` - Dias disponíveis
- `POST /api/availability/days` - Definir dias (admin)
- `GET /api/availability/blocked/:professionalId` - Dias bloqueados
- `POST /api/availability/blocked` - Bloquear dia (admin)

## Próximos Passos

Para usar este backend, você precisará:

1. Criar um arquivo `src/lib/api.ts` no frontend
2. Substituir as chamadas do Supabase pelas chamadas à API local
3. Atualizar o AuthProvider para usar JWT

A API está pronta em `http://localhost:3001/api`
