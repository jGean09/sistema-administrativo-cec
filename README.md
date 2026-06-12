# Sistema Administrativo CEC

**Casa do Estudante de Caicó**

Sistema web para gestão de sócios, notícias, documentos e comunicados internos da CEC.

---

## 🌐 Deploy

| Camada | Plataforma | URL |
|--------|-----------|-----|
| Frontend | Vercel | https://sistema-administrativo-cec.vercel.app |
| Backend | Render | https://sistema-administrativo-cec.onrender.com |
| Banco de Dados | Supabase (PostgreSQL) | Painel: https://supabase.com |

---

## 🛠 Stack

- **Frontend:** React 18 (porta 3000 em dev)
- **Backend:** Node.js + Express (porta 3001 em dev)
- **Banco:** PostgreSQL via Supabase (produção) / Docker (desenvolvimento local)
- **Autenticação:** JWT
- **PDF:** PDFKit com padrão Builder
- **E-mail:** Nodemailer (SMTP Gmail)

---

## 📁 Estrutura do Projeto

```
projeto_POO2/
│
├── backend/
│   └── src/
│       ├── config/
│       │   ├── database.js          # Conexão com o PostgreSQL
│       │   ├── migrate.js           # Criação das tabelas
│       │   ├── seed.js              # Dados iniciais
│       │   └── upload.js            # Configuração do Multer
│       │
│       ├── controllers/
│       │   ├── authController.js         # Login e autenticação
│       │   ├── socioController.js        # CRUD de sócios
│       │   ├── noticiaController.js      # CRUD de notícias
│       │   ├── fichaController.js        # Geração de fichas em PDF
│       │   ├── declaracaoController.js   # Geração de declarações
│       │   └── emailController.js        # Disparo de comunicados por e-mail
│       │
│       ├── middlewares/
│       │   └── auth.js              # Verificação do token JWT
│       │
│       ├── routes/
│       │   └── index.js             # Definição de todas as rotas da API
│       │
│       ├── services/
│       │   ├── authService.js
│       │   ├── socioService.js
│       │   ├── noticiaService.js
│       │   ├── fichaService.js
│       │   ├── fichaBuilder.js           # Padrão Builder para PDF de ficha
│       │   ├── declaracaoService.js
│       │   ├── declaracaoBuilder.js      # Padrão Builder para declarações
│       │   └── emailService.js           # Integração SMTP
│       │
│       └── server.js                # Entry point do servidor Express
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Home.jsx
        │   ├── LandingPage.jsx
        │   ├── Perfil.jsx
        │   └── admin/
        │       ├── ListaSocios.jsx       # Listagem com filtros e ordenação
        │       ├── CadastroInterno.jsx   # Cadastro de novo sócio
        │       ├── EditarSocio.jsx       # Edição de sócio existente
        │       ├── GerenciarNoticias.jsx # CRUD de notícias
        │       └── EnviarEmail.jsx       # Módulo de envio de comunicados
        │
        ├── components/
        │   ├── Layout.jsx
        │   └── CardNoticia.jsx
        │
        ├── services/
        │   └── api.js               # Instância do Axios com interceptors
        │
        ├── context/
        │   └── AuthContext.jsx      # Contexto global de autenticação
        │
        └── assets/                  # Imagens e recursos estáticos
```

---

## ⚙️ Variáveis de Ambiente

> ⚠️ Em produção (Render/Vercel), as variáveis devem ser configuradas **no painel da plataforma**, não no arquivo `.env`. O arquivo `.env` é usado apenas em desenvolvimento local e deve estar no `.gitignore`.

### Backend (`backend/.env`)

```env
# Banco de Dados (Supabase em produção / Docker em dev)
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres

# JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=7d

# Servidor
PORT=3001
NODE_ENV=development

# CORS — URL do frontend
FRONTEND_URL=http://localhost:3000

# E-mail (SMTP Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail
```

### Frontend (`frontend/.env`)

```env
# URL da API (backend)
REACT_APP_API_URL=http://localhost:3001/api
```

### Variáveis de Produção (configurar no painel do Render e da Vercel)

| Variável | Render (backend) | Vercel (frontend) |
|----------|-----------------|-------------------|
| `DATABASE_URL` | URL do Supabase Pooler | — |
| `JWT_SECRET` | Chave secreta segura | — |
| `JWT_EXPIRES_IN` | `7d` | — |
| `NODE_ENV` | `production` | — |
| `FRONTEND_URL` | `https://sistema-administrativo-cec.vercel.app` | — |
| `EMAIL_USER` | E-mail SMTP | — |
| `EMAIL_PASS` | Senha de app Gmail | — |
| `REACT_APP_API_URL` | — | `https://sistema-administrativo-cec.onrender.com/api` |

---

## 🚀 Instalação Local

### Pré-requisitos

- Node.js v18+
- Docker Desktop (para o banco local)

### 1. Banco de dados (Docker)

```bash
docker run --name cec_postgres \
  -e POSTGRES_PASSWORD=admin \
  -p 5432:5432 \
  -d postgres
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # edite com seus dados locais
npm run migrate        # cria as tabelas
npm run seed           # popula dados iniciais (opcional)
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

O frontend abrirá em `http://localhost:3000` e consumirá a API em `http://localhost:3001`.

---

## 🔑 Acesso Padrão

| Campo | Valor |
|-------|-------|
| E-mail | cadastrado no sistema |
| Senha inicial | CPF sem pontos e traço |

A senha pode ser alterada na tela de **Perfil** após o primeiro acesso.

---

## ✅ Funcionalidades

### Autenticação e Segurança
- Login com e-mail + senha (JWT)
- Senha padrão = CPF sem pontos e traço (primeiro acesso)
- Troca de senha pelo perfil
- Controle de acesso por cargo
- Rotas protegidas por middleware JWT

### Gestão de Sócios
- Cadastro completo (dados pessoais, filiação, endereço, acadêmico, saúde)
- Edição de todos os campos
- Listagem com filtros: departamento, status, busca por nome
- Ordenação: nome A→Z, nome Z→A, mais novo, mais velho, matrícula
- Badges de resumo: total, ativos, masculino, feminino
- Geração automática de matrícula (ANO + sequência + dígito)

### Ficha Individual PDF
- Geração automática no modelo oficial da CEC
- Cabeçalho com logo, endereços e CNPJ
- Todos os campos: dados pessoais, filiação, endereço, acadêmico, saúde
- Assinaturas e rodapé com documentação exigida
- Acessível pela listagem e pela tela de edição

### Declarações
- Geração de declarações oficiais em PDF
- Padrão Builder para montagem flexível do documento

### Notícias e Comunicados
- CRUD completo (publicar, editar, excluir)
- Categorias: Aviso Geral, Edital, Assembleia, Portaria, Escala de Limpeza
- Visibilidade: Pública (todos) ou Exclusiva para sócios
- Upload de imagem (até 10 MB)
- Feed estilo rede social com modal de leitura completa
- Filtros por categoria no feed interno

### Envio de E-mails
- Disparo de comunicados em massa para sócios
- Integração via SMTP com Gmail

### Páginas Públicas (sem login)
- Landing page com hero, foto da casa e botão de inscrição
- Seção de editais e notícias públicas
- Link direto para formulário de inscrição (Google Forms)

### Área do Sócio (login obrigatório)
- Feed de notícias internas com filtros por categoria
- Widget de horários por departamento (Masculino / Feminino)
- Widget de informações de mensalidade
- Perfil completo com troca de senha

---

## 🧱 Padrões de Projeto Aplicados

| Padrão | Onde é usado |
|--------|-------------|
| **MVC** | Separação de controllers, services e rotas |
| **Service Layer** | Regras de negócio isoladas dos controllers |
| **Builder** | Montagem de PDFs (`fichaBuilder.js`, `declaracaoBuilder.js`) |
| **Strategy** | Permissões por cargo sem if/else encadeado |
| **Facade** | Chamadas HTTP centralizadas em `api.js` (frontend) |
| **GRASP Expert/Creator/Controller** | Responsabilidades bem definidas por arquivo |
| **SOLID S** | Cada arquivo tem uma única responsabilidade |
| **SOLID O** | Atualização dinâmica de campos sem modificar código existente |