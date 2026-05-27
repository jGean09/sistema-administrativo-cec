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
- Todos os campos da ficha: dados pessoais, filiação, endereço, acadêmico, saúde
- Assinaturas e rodapé com documentação exigida
- Acessível direto pela listagem e pela tela de edição

### Notícias e Comunicados
- CRUD completo (publicar, editar, excluir)
- Categorias: Aviso Geral, Edital, Assembleia, Portaria, Escala de Limpeza
- Visibilidade: Pública (todos) ou Exclusiva para sócios
- Upload de imagem (até 10MB)
- Feed estilo rede social com modal de leitura completa
- Filtros por categoria no feed interno

### Páginas Públicas (sem login)
- Landing page com hero, foto da casa e botão de inscrição
- Seção de editais e notícias públicas na landing page
- Link direto para formulário de inscrição (Google Forms)

### Área do Sócio (login obrigatório)
- Feed de notícias internas com filtros por categoria
- Widget de horários por departamento (Masculino / Feminino)
- Widget de informações de mensalidade
- Perfil completo com troca de senha

### Padrões de Projeto Aplicados
- **MVC**: separação clara de Model, View e Controller
- **Service Layer**: regras de negócio isoladas dos controllers
- **Strategy**: permissões por cargo sem if/else encadeado
- **Facade**: chamadas HTTP centralizadas no frontend
- **GRASP Expert/Creator/Controller**: responsabilidades bem definidas
- **SOLID S**: cada arquivo tem uma única responsabilidade
- **SOLID O**: atualização dinâmica de campos sem modificar o código