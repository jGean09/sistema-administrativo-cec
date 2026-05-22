const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, nome, email, tipo_usuario, cargo, departamento, status_socio FROM socios WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (result.rows[0].status_socio === 'suspenso') {
      return res.status(403).json({ error: 'Sua conta está suspensa. Entre em contato com a diretoria.' });
    }

    req.usuario = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

const exigeDiretoria = (req, res, next) => {
  const { tipo_usuario } = req.usuario;
  if (!['diretoria', 'presidente', 'admin'].includes(tipo_usuario)) {
    return res.status(403).json({ error: 'Acesso restrito à diretoria.' });
  }
  next();
};

const exigePresidente = (req, res, next) => {
  if (!['presidente', 'admin'].includes(req.usuario.tipo_usuario)) {
    return res.status(403).json({ error: 'Acesso restrito ao presidente.' });
  }
  next();
};

const podeCadastrarSocio = (req, res, next) => {
  const { tipo_usuario, cargo } = req.usuario;
  const cargosPermitidos = ['Presidente', 'Vice-Presidente', 'Secretário Geral'];
  const ehAdmin = ['presidente', 'admin'].includes(tipo_usuario);
  const temCargo = cargosPermitidos.includes(cargo);

  if (ehAdmin || temCargo) return next();

  return res.status(403).json({
    error: 'Apenas o Presidente, Vice-Presidente ou Secretário Geral podem cadastrar sócios.'
  });
};

const permissaoPorTipo = (tipoNoticia) => (req, res, next) => {
  const { cargo, tipo_usuario } = req.usuario;
  if (['presidente', 'admin'].includes(tipo_usuario)) return next();

  const permissoes = {
    'edital': ['Presidente', 'Secretário Geral'],
    'ata_assembleia': ['Secretário Geral'],
    'escala_limpeza': ['Diretor de Disciplina e Higiene', 'Diretora de Disciplina e Higiene'],
    'relatorio_gastos': ['Diretor de Tesouraria'],
    'comunicado': ['diretoria', 'presidente'],
    'noticia_geral': ['Diretor de Cultura e Publicidade'],
  };

  const cargosPermitidos = permissoes[tipoNoticia] || [];
  if (cargosPermitidos.includes(cargo) || cargosPermitidos.includes(tipo_usuario)) {
    return next();
  }

  return res.status(403).json({
    error: `Seu cargo (${cargo}) não tem permissão para publicar este tipo de conteúdo.`
  });
};

// Exportação única e limpa no final
module.exports = { 
  authMiddleware, 
  exigeDiretoria, 
  exigePresidente, 
  permissaoPorTipo, 
  podeCadastrarSocio 
};