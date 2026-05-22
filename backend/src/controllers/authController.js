const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login: email + CPF como senha padrão
const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, nome, email, cpf, senha_hash, tipo_usuario, cargo, 
              departamento, status_socio, matricula
       FROM socios WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const socio = result.rows[0];

    if (socio.status_socio === 'suspenso') {
      return res.status(403).json({ 
        error: 'Conta suspensa. Entre em contato com a diretoria da CEC.' 
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, socio.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: socio.id, tipo_usuario: socio.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      token,
      usuario: {
        id: socio.id,
        nome: socio.nome,
        email: socio.email,
        matricula: socio.matricula,
        tipo_usuario: socio.tipo_usuario,
        cargo: socio.cargo,
        departamento: socio.departamento,
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Retorna dados do usuário logado
const perfil = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, matricula, nome, data_nascimento, genero, naturalidade, cpf, rg,
              nome_pai, nome_mae, telefone, email, endereco_logradouro, endereco_numero,
              endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
              instituicao, escolaridade, periodo_serie, ano_inclusao,
              departamento, status_socio, data_inclusao, cargo, tipo_usuario,
              alergias, medicacao, doenca_cronica, deficiencia, tratamento_medico
       FROM socios WHERE id = $1`,
      [req.usuario.id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
};

// Trocar senha
const trocarSenha = async (req, res) => {
  const { senha_atual, nova_senha } = req.body;

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  if (nova_senha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres.' });
  }

  try {
    const result = await pool.query('SELECT senha_hash FROM socios WHERE id = $1', [req.usuario.id]);
    const senhaCorreta = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const novaHash = await bcrypt.hash(nova_senha, 10);
    await pool.query('UPDATE socios SET senha_hash = $1 WHERE id = $2', [novaHash, req.usuario.id]);

    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};

module.exports = { login, perfil, trocarSenha };
