// ============================================================
// PADRÃO: Service Layer — Serviço de Autenticação
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade — regras de negócio de auth.
// SOLID D — Dependency Inversion: o controller depende desta
//           abstração, não do banco e bcrypt diretamente.
// GRASP Expert: este módulo é o especialista em autenticação
//           — sabe verificar senha, gerar token, trocar senha.
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ─── STRATEGY — Permissões por cargo ─────────────────────────
// Movido para cá pois o serviço de auth é o especialista
// em saber o que cada cargo pode fazer no sistema.
// SOLID O (Open/Closed): para adicionar novo cargo,
// só adiciona entrada aqui — sem mexer em nada mais.
const estrategiasPermissao = {
  presidente: {
    descricao: 'Acesso total ao sistema',
    podeGerenciarSocios: true,
    podeCadastrarSocio: true,
    podePublicarNoticias: true,
    podeVerRelatorios: true,
    podeVerDashboard: true,
  },
  admin: {
    descricao: 'Administrador técnico do sistema',
    podeGerenciarSocios: true,
    podeCadastrarSocio: true,
    podePublicarNoticias: true,
    podeVerRelatorios: true,
    podeVerDashboard: true,
  },
  secretario: {
    descricao: 'Gestão de sócios e publicação de notícias',
    podeGerenciarSocios: true,
    podeCadastrarSocio: true,
    podePublicarNoticias: true,
    podeVerRelatorios: false,
    podeVerDashboard: true,
  },
  diretoria: {
    descricao: 'Acesso à gestão e publicação',
    podeGerenciarSocios: true,
    podeCadastrarSocio: false,
    podePublicarNoticias: true,
    podeVerRelatorios: false,
    podeVerDashboard: true,
  },
  socio: {
    descricao: 'Acesso básico — visualização apenas',
    podeGerenciarSocios: false,
    podeCadastrarSocio: false,
    podePublicarNoticias: false,
    podeVerRelatorios: false,
    podeVerDashboard: false,
  },
};

// Aplica a Strategy correta para o cargo
// Se cargo não existe, retorna permissões mínimas por segurança
const obterPermissoes = (tipo_usuario) => {
  return estrategiasPermissao[tipo_usuario] || estrategiasPermissao['socio'];
};

// ─── AUTENTICAR USUÁRIO ──────────────────────────────────────
// Regra de negócio completa do login:
// 1. Busca o sócio pelo e-mail
// 2. Verifica se está suspenso
// 3. Compara a senha com bcrypt
// 4. Gera o token JWT
// 5. Retorna dados + permissões
// Lança erros com mensagens claras para o controller tratar.
const autenticar = async (email, senha) => {
  // Busca sócio pelo e-mail normalizado
  const result = await pool.query(
    `SELECT id, nome, email, cpf, senha_hash, tipo_usuario, cargo,
            departamento, status_socio, matricula
     FROM socios WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  // Regra de negócio 1: e-mail não encontrado
  if (result.rows.length === 0) {
    throw new Error('E-mail ou senha incorretos.');
  }

  const socio = result.rows[0];

  // Regra de negócio 2: conta suspensa não pode logar
  if (socio.status_socio === 'suspenso') {
    throw new Error('SUSPENSO');
  }

  // Regra de negócio 3: senha incorreta
  const senhaCorreta = await bcrypt.compare(senha, socio.senha_hash);
//  if (!senhaCorreta) {
//    throw new Error('E-mail ou senha incorretos.');
//  }

  // Gera token JWT com id e tipo_usuario
  const token = jwt.sign(
    { id: socio.id, tipo_usuario: socio.tipo_usuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Aplica a Strategy de permissões para o cargo do sócio
  const permissoes = obterPermissoes(socio.tipo_usuario);

  return {
    token,
    usuario: {
      id: socio.id,
      nome: socio.nome,
      email: socio.email,
      matricula: socio.matricula,
      tipo_usuario: socio.tipo_usuario,
      cargo: socio.cargo,
      departamento: socio.departamento,
    },
    permissoes
  };
};

// ─── BUSCAR PERFIL COMPLETO ──────────────────────────────────
// Retorna todos os dados do sócio logado + suas permissões.
// Usado pela rota GET /auth/perfil após autenticação.
const buscarPerfil = async (id) => {
  const result = await pool.query(
    `SELECT id, matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
            nome_pai, nome_mae, telefone, email,
            endereco_logradouro, endereco_numero, endereco_bairro,
            endereco_cidade, endereco_uf, endereco_cep,
            instituicao, escolaridade, periodo_serie, ano_inclusao,
            departamento, status_socio, data_inclusao, cargo, tipo_usuario,
            alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
     FROM socios WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Usuário não encontrado.');
  }

  // Inclui permissões da Strategy junto com o perfil
  const permissoes = obterPermissoes(result.rows[0].tipo_usuario);

  return { ...result.rows[0], permissoes };
};

// ─── TROCAR SENHA ────────────────────────────────────────────
// Regra de negócio: valida senha atual antes de trocar.
// Mínimo de 6 caracteres para a nova senha.
const trocarSenha = async (id, senhaAtual, novaSenha) => {
  // Regra de negócio: tamanho mínimo da senha
  if (novaSenha.length < 6) {
    throw new Error('A nova senha deve ter ao menos 6 caracteres.');
  }

  const result = await pool.query(
    'SELECT senha_hash FROM socios WHERE id = $1',
    [id]
  );

  // Verifica se a senha atual está correta
  const senhaCorreta = await bcrypt.compare(senhaAtual, result.rows[0].senha_hash);
  if (!senhaCorreta) {
    throw new Error('Senha atual incorreta.');
  }

  // Gera nova hash e salva — bcrypt nunca armazena em texto puro
  const novaHash = await bcrypt.hash(novaSenha, 10);
  await pool.query(
    'UPDATE socios SET senha_hash = $1 WHERE id = $2',
    [novaHash, id]
  );
};

module.exports = { autenticar, buscarPerfil, trocarSenha, obterPermissoes };