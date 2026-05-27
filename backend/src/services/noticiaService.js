// ============================================================
// PADRÃO: Service Layer — Serviço de Notícias
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade — regras de negócio de notícias.
// GRASP Expert: este módulo é o especialista em notícias —
//           sabe listar, publicar, editar e excluir.
// GRASP Creator: é aqui que a notícia é criada de verdade,
//           pois este módulo tem todos os dados necessários.
// ============================================================

const pool = require('../config/database');

// ─── LISTAR NOTÍCIAS PÚBLICAS ────────────────────────────────
// Regra de negócio: apenas notícias com visibilidade='publica'
// são retornadas — usado na landing page sem autenticação.
// Limite de 20 para não sobrecarregar a página pública.
const listarPublicas = async ({ categoria } = {}) => {
  let where = `WHERE visibilidade = 'publica'`;
  const params = [];

  // Filtro opcional por categoria — ex: ?categoria=edital
  if (categoria) {
    where += ` AND categoria = $1`;
    params.push(categoria);
  }

  const result = await pool.query(
    `SELECT id, titulo, conteudo, categoria, imagem_url, autor_nome, created_at
     FROM noticias ${where}
     ORDER BY created_at DESC
     LIMIT 20`,
    params
  );

  return result.rows;
};

// ─── LISTAR NOTÍCIAS PARA SÓCIOS ────────────────────────────
// Regra de negócio: sócios logados veem notícias públicas
// E notícias exclusivas para sócios (assembleias, portarias).
// Limite maior pois é o feed interno do sistema.
const listar = async ({ categoria } = {}) => {
  let where = `WHERE (visibilidade = 'publica' OR visibilidade = 'socios')`;
  const params = [];

  if (categoria) {
    where += ` AND categoria = $1`;
    params.push(categoria);
  }

  const result = await pool.query(
    `SELECT id, titulo, conteudo, categoria, visibilidade, imagem_url, autor_nome, created_at
     FROM noticias ${where}
     ORDER BY created_at DESC
     LIMIT 50`,
    params
  );

  return result.rows;
};

// ─── PUBLICAR NOTÍCIA ────────────────────────────────────────
// GRASP Creator: este serviço cria a notícia pois possui
// todos os dados necessários para inicializá-la.
// SOLID S: responsabilidade única — criar uma notícia válida.
// Lança erro se título ou conteúdo estiverem ausentes.
const publicarNoticia = async ({ titulo, conteudo, categoria, visibilidade, imagem_url, autor_id, autor_nome }) => {
  // Regra de negócio: título e conteúdo são obrigatórios
  if (!titulo || !conteudo) {
    throw new Error('Título e conteúdo são obrigatórios.');
  }

  const result = await pool.query(
    `INSERT INTO noticias (titulo, conteudo, categoria, visibilidade, imagem_url, autor_id, autor_nome)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      titulo,
      conteudo,
      categoria || 'aviso',       // padrão: aviso geral
      visibilidade || 'publica',  // padrão: visível para todos
      imagem_url,
      autor_id,
      autor_nome
    ]
  );

  return result.rows[0];
};

// ─── EDITAR NOTÍCIA ──────────────────────────────────────────
// Regra de negócio: se não enviar nova imagem, mantém a atual.
// Isso evita apagar a imagem acidentalmente ao editar só o texto.
const editarNoticia = async (id, { titulo, conteudo, categoria, visibilidade, imagem_url }) => {
  // Verifica se a notícia existe antes de editar
  const atual = await pool.query(
    'SELECT * FROM noticias WHERE id = $1',
    [id]
  );

  if (atual.rows.length === 0) {
    throw new Error('Notícia não encontrada.');
  }

  // Se não veio nova imagem, mantém a imagem anterior
  const nova_imagem = imagem_url || atual.rows[0].imagem_url;

  await pool.query(
    `UPDATE noticias
     SET titulo=$1, conteudo=$2, categoria=$3, visibilidade=$4, imagem_url=$5
     WHERE id=$6`,
    [titulo, conteudo, categoria, visibilidade, nova_imagem, id]
  );
};

// ─── EXCLUIR NOTÍCIA ─────────────────────────────────────────
// Remove permanentemente a notícia do banco.
// Regra de negócio: qualquer membro da diretoria pode excluir
// (controle feito pelo middleware exigeDiretoria na rota).
const excluirNoticia = async (id) => {
  await pool.query(
    'DELETE FROM noticias WHERE id = $1',
    [id]
  );
};

module.exports = {
  listarPublicas,
  listar,
  publicarNoticia,
  editarNoticia,
  excluirNoticia
};