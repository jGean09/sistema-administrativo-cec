# Sistema Administrativo CEC
Casa do Estudante de Caicó 

## Stack
- Frontend: React (porta 3000)
- Backend: Node.js + Express (porta 3001)
- Banco: PostgreSQL via Docker

## Pré-requisitos
- Node.js v18+
- Docker Desktop

## Instalação

### 1. Banco de dados
```bash
docker run --name cec_postgres -e POSTGRES_PASSWORD=admin -p 5432:5432 -d postgres
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

## Variáveis de ambiente (backend/.env)

Crie um arquivo `.env` na pasta do backend e preencha com os seus dados:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cec_sistema
DB_USER=postgres
DB_PASSWORD=<sua_senha_do_banco>
JWT_SECRET=<sua_chave_secreta_super_segura>
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

## Login padrão
Senha inicial de cada sócio = CPF sem pontos e traço

## Funcionalidades
- Autenticação JWT
- Gestão de sócios (cadastro, edição, filtros)
- Geração de ficha individual em PDF
- Controle de acesso por cargo
- Landing page pública