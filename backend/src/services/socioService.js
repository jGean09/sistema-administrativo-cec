// ============================================================
// PADRÃO: Service Layer (Camada de Serviço)
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade: conter as regras de negócio
//           relacionadas a sócios.
// SOLID D — Dependency Inversion: o controller vai depender
//           desta abstração, não do banco diretamente.
// GRASP Creator: é aqui que o sócio é "criado" de verdade,
//           pois este módulo tem todos os dados necessários.
// GRASP Expert: este módulo é o especialista em sócios —
//           ele sabe gerar matrícula, verificar duplicidade
//           e montar o objeto completo antes de salvar.
// ============================================================
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// ─── GERAR MATRÍCULA ─────────────────────────────────────────
// GRASP Creator: a responsabilidade de gerar a matrícula
// pertence ao serviço de sócio, pois é ele quem tem acesso
// ao banco para contar quantos sócios existem naquele ano.
// Formato: ANO + sequência 4 dígitos + 2 dígitos aleatórios
// Exemplo: 20260001-47
const gerarMatricula = async () => {
  const ano = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM socios WHERE matricula LIKE $1`,
    [`${ano}%`]
  );
  const seq = parseInt(result.rows[0].count) + 1;
  const digito = Math.floor(Math.random() * 90 + 10);
  return `${ano}${String(seq).padStart(4, '0')}-${digito}`;
};

// ─── VERIFICAR DUPLICIDADE ───────────────────────────────────
// Regra de negócio: não pode existir dois sócios com o
// mesmo CPF ou e-mail no sistema.
// Retorna true se já existe, false se está livre.
const verificarDuplicidade = async (cpf, email) => {
  const result = await pool.query(
    'SELECT id FROM socios WHERE cpf = $1 OR email = $2',
    [cpf, email.toLowerCase()]
  );
  return result.rows.length > 0;
};

// ─── CADASTRAR SÓCIO ─────────────────────────────────────────
// SOLID S: esta função tem uma única responsabilidade —
//          executar a regra de negócio de cadastro de sócio.
// O controller apenas chama esta função e trata a resposta HTTP.
// Lança erros com mensagens claras para o controller tratar.
const cadastrarSocio = async (dados) => {
  const {
    nome, data_nascimento, genero, naturalidade, cpf, rg,
    nome_pai, nome_mae, telefone, email,
    endereco_logradouro, endereco_numero, endereco_bairro,
    endereco_cidade, endereco_uf, endereco_cep,
    instituicao, escolaridade, periodo_serie, ano_inclusao,
    data_inclusao, curso, quarto,
    departamento, status_socio, cargo, tipo_usuario,
    alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
  } = dados;

  // Regra de negócio 1: verificar duplicidade antes de inserir
  const duplicado = await verificarDuplicidade(cpf, email);
  if (duplicado) {
    // Lança erro — o controller vai capturar e retornar 409
    throw new Error('CPF ou e-mail já cadastrado.');
  }

  // Regra de negócio 2: gerar matrícula automaticamente
  const matricula = await gerarMatricula();

  // Regra de negócio 3: senha padrão = CPF só números
  // bcrypt nunca armazena senha em texto puro (segurança)
  const senhaHash = await bcrypt.hash(cpf.replace(/\D/g, ''), 10);

  // Inserção no banco com todos os campos mapeados
  const result = await pool.query(
    `INSERT INTO socios (
      matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
      nome_pai, nome_mae, telefone, email, senha_hash,
      endereco_logradouro, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_uf, endereco_cep,
      instituicao, escolaridade, periodo_serie, ano_inclusao,
      data_inclusao, curso, quarto,
      departamento, status_socio, cargo, tipo_usuario,
      alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
      $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
      $23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34
    ) RETURNING id, matricula, nome`,
    [
      matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
      nome_pai, nome_mae, telefone, email.toLowerCase(), senhaHash,
      endereco_logradouro, endereco_numero, endereco_bairro,
      endereco_cidade, endereco_uf, endereco_cep,
      instituicao, escolaridade, periodo_serie, ano_inclusao,
      data_inclusao, curso, quarto,
      departamento, status_socio || 'ativo', cargo, tipo_usuario || 'socio',
      alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
    ]
  );

  // Retorna os dados básicos do sócio criado
  return result.rows[0];
};

// ─── LISTAR SÓCIOS ───────────────────────────────────────────
// GRASP Expert: o serviço é o especialista em montar
// a query de listagem com filtros dinâmicos.
const listarSocios = async ({ departamento, status, busca, pagina = 1, limite = 200 }) => {
  const offset = (pagina - 1) * limite;
  let where = [];
  let params = [];

  if (departamento) {
    where.push(`departamento = $${params.length + 1}`);
    params.push(departamento);
  }
  if (status) {
    where.push(`status_socio = $${params.length + 1}`);
    params.push(status);
  }
  if (busca) {
    where.push(`(nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR matricula ILIKE $${params.length + 1})`);
    params.push(`%${busca}%`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  // Executa as duas queries em paralelo para melhor performance
  const [socios, total] = await Promise.all([
    pool.query(
      `SELECT id, matricula, nome, email, cpf, telefone, departamento,
              status_socio, cargo, tipo_usuario, ano_inclusao, instituicao
       FROM socios ${whereClause}
       ORDER BY nome ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limite, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM socios ${whereClause}`,
      params
    )
  ]);

  return {
    socios: socios.rows,
    total: parseInt(total.rows[0].count),
    pagina: parseInt(pagina),
    totalPaginas: Math.ceil(total.rows[0].count / limite)
  };
};

// ─── BUSCAR POR ID ───────────────────────────────────────────
// Retorna todos os dados de um sócio — usado na edição e PDF.
const buscarSocioPorId = async (id) => {
  const result = await pool.query(
    'SELECT * FROM socios WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error('Sócio não encontrado.');
  }
  return result.rows[0];
};

// ─── ATUALIZAR SÓCIO ─────────────────────────────────────────
// SOLID O (Open/Closed): atualização dinâmica — não precisa
// modificar este método quando novos campos são adicionados.
// Só atualiza os campos enviados, sem sobrescrever o resto.
const atualizarSocio = async (id, campos) => {
  const keys = Object.keys(campos).filter(k => k !== 'id' && k !== 'senha_hash');
  const values = keys.map(k => campos[k]);
  const setQuery = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

  await pool.query(
    `UPDATE socios SET ${setQuery} WHERE id = $${keys.length + 1}`,
    [...values, id]
  );
};

// Exporta todas as funções do serviço
module.exports = {
  cadastrarSocio,
  listarSocios,
  buscarSocioPorId,
  atualizarSocio
};