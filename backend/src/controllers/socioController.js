const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const gerarMatricula = async () => {
  const ano = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM socios WHERE matricula LIKE $1`,
    [`${ano}%`]
  );
  const seq = parseInt(result.rows[0].count) + 1;
  return `${ano}${String(seq).padStart(4, '0')}-${Math.floor(Math.random() * 90 + 10)}`;
};

const listar = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { departamento, status, busca, pagina = 1, limite = 200 } = req.query;
  const offset = (pagina - 1) * limite;
  let where = [];
  let params = [];

  if (departamento) { where.push(`departamento = $${params.length + 1}`); params.push(departamento); }
  if (status) { where.push(`status_socio = $${params.length + 1}`); params.push(status); }
  if (busca) {
    where.push(`(nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR matricula ILIKE $${params.length + 1})`);
    params.push(`%${busca}%`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [socios, total] = await Promise.all([
      pool.query(
        `SELECT id, matricula, nome, email, cpf, telefone, departamento, 
                status_socio, cargo, tipo_usuario, ano_inclusao, instituicao
         FROM socios ${whereClause}
         ORDER BY nome ASC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limite, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM socios ${whereClause}`, params)
    ]);

    return res.json({
      socios: socios.rows,
      total: parseInt(total.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total.rows[0].count / limite)
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar sócios.' });
  }
};

const cadastrar = async (req, res) => {
  const {
    nome, data_nascimento, genero, naturalidade, cpf, rg,
    nome_pai, nome_mae, telefone, email,
    endereco_logradouro, endereco_numero, endereco_bairro,
    endereco_cidade, endereco_uf, endereco_cep,
    instituicao, escolaridade, periodo_serie, ano_inclusao,
    departamento, status_socio,
    alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
  } = req.body;

  try {
    const duplicado = await pool.query('SELECT id FROM socios WHERE cpf = $1 OR email = $2', [cpf, email.toLowerCase()]);
    if (duplicado.rows.length > 0) return res.status(409).json({ error: 'CPF ou e-mail já cadastrado.' });

    const matricula = await gerarMatricula();
    
    // CORREÇÃO: Transformando o CPF em hash (sem retirar os pontos, para manter o padrão)
    const senhaHashSegura = await bcrypt.hash(cpf, 10);

    const result = await pool.query(
      `INSERT INTO socios (
        matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
        nome_pai, nome_mae, telefone, email, senha_hash, /* CORREÇÃO DO NOME DA COLUNA AQUI */
        endereco_logradouro, endereco_numero, endereco_bairro,
        endereco_cidade, endereco_uf, endereco_cep,
        instituicao, escolaridade, periodo_serie, ano_inclusao,
        departamento, status_socio,
        alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      ) RETURNING id, matricula, nome`,
      [
        matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
        nome_pai, nome_mae, telefone, email.toLowerCase(), senhaHashSegura, // Passando o Hash aqui
        endereco_logradouro, endereco_numero, endereco_bairro,
        endereco_cidade, endereco_uf, endereco_cep,
        instituicao, escolaridade, periodo_serie, ano_inclusao,
        departamento, status_socio || 'ativo',
        alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
      ]
    );

    res.status(201).json({ message: 'Sócio cadastrado com sucesso!', socio: result.rows[0] });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: 'Erro ao cadastrar no banco.' });
  }
};
const buscarPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM socios WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sócio não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar sócio.' });
  }
};

const atualizar = async (req, res) => {
  const { id } = req.params;
  const campos = req.body;
  
  // Criando a query dinamicamente (mais eficiente em POO)
  const keys = Object.keys(campos).filter(k => k !== 'id' && k !== 'senha');
  const values = keys.map(k => campos[k]);
  const setQuery = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

  try {
    await pool.query(
      `UPDATE socios SET ${setQuery} WHERE id = $${keys.length + 1}`,
      [...values, id]
    );
    res.json({ message: 'Sócio atualizado com sucesso!' });
  } catch (err) {
    console.error(err); // Isso ajuda você a ver o erro real no terminal do VS Code
    res.status(500).json({ error: 'Erro ao atualizar no banco.' });
  }
};

module.exports = { listar, cadastrar, buscarPorId, atualizar };