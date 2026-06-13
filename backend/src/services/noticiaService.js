// ============================================================
// PADRÃO: Service Layer — Serviço de Notícias
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade — regras de negócio de notícias.
// GRASP Expert: este módulo é o especialista em notícias —
//           sabe listar, publicar, editar, excluir e servir anexos.
// GRASP Creator: é aqui que a notícia é criada de verdade,
//           pois este módulo tem todos os dados necessários.
//
// MUDANÇA ARQUITETURAL: imagens e PDFs não são mais salvos em
// disco. São convertidos para base64 e persistidos no banco.
// Motivo: filesystem efêmero do Render apagava os arquivos.
// ============================================================

const pool = require('../config/database');

// ─── LISTAR NOTÍCIAS PÚBLICAS ────────────────────────────────
// Regra de negócio: apenas notícias com visibilidade='publica'
// são retornadas — usado na landing page sem autenticação.
// Retorna imagem_base64 no lugar de imagem_url.
const listarPublicas = async ({ categoria } = {}) => {
  let where = `WHERE visibilidade = 'publica'`;
  const params = [];

  if (categoria) {
    where += ` AND categoria = $1`;
    params.push(categoria);
  }

  const result = await pool.query(
    `SELECT id, titulo, conteudo, categoria, imagem_base64, autor_nome, created_at
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
// Para cada notícia, busca também os anexos PDF vinculados
// (apenas id e nome — os dados base64 são servidos sob demanda).
const listar = async ({ categoria } = {}) => {
  let where = `WHERE (visibilidade = 'publica' OR visibilidade = 'socios')`;
  const params = [];

  if (categoria) {
    where += ` AND categoria = $1`;
    params.push(categoria);
  }

  const result = await pool.query(
    `SELECT id, titulo, conteudo, categoria, visibilidade, imagem_base64, autor_nome, created_at
     FROM noticias ${where}
     ORDER BY created_at DESC
     LIMIT 50`,
    params
  );

  const noticias = result.rows;

  // Busca os anexos de cada notícia — só id e nome para não
  // trafegar os dados base64 desnecessariamente na listagem.
  for (const n of noticias) {
    const anexos = await pool.query(
      `SELECT id, nome FROM noticia_anexos WHERE noticia_id = $1 ORDER BY created_at ASC`,
      [n.id]
    );
    n.anexos = anexos.rows;
  }

  return noticias;
};

// ─── PUBLICAR NOTÍCIA ────────────────────────────────────────
// GRASP Creator: este serviço cria a notícia pois possui
// todos os dados necessários para inicializá-la.
// SOLID S: responsabilidade única — criar uma notícia válida.
// Converte o buffer da imagem para data URL base64.
// Salva cada PDF como base64 na tabela noticia_anexos.
const publicarNoticia = async ({ titulo, conteudo, categoria, visibilidade, imagemBuffer, imagemMime, anexosFiles, autor_id, autor_nome }) => {
  if (!titulo || !conteudo) {
    throw new Error('Título e conteúdo são obrigatórios.');
  }

  // Converte imagem para data URL base64 — persiste no banco,
  // nunca mais depende do disco do servidor.
  const imagem_base64 = imagemBuffer
    ? `data:${imagemMime};base64,${imagemBuffer.toString('base64')}`
    : null;

  const result = await pool.query(
    `INSERT INTO noticias (titulo, conteudo, categoria, visibilidade, imagem_base64, autor_id, autor_nome)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      titulo,
      conteudo,
      categoria || 'aviso',
      visibilidade || 'publica',
      imagem_base64,
      autor_id,
      autor_nome
    ]
  );

  const noticia = result.rows[0];

  // Salva cada PDF enviado como base64 na tabela de anexos,
  // vinculado pelo noticia_id com FK e ON DELETE CASCADE.
  for (const file of anexosFiles) {
    const dados = file.buffer.toString('base64');
    await pool.query(
      `INSERT INTO noticia_anexos (noticia_id, nome, dados) VALUES ($1, $2, $3)`,
      [noticia.id, file.originalname, dados]
    );
  }

  return noticia;
};

// ─── EDITAR NOTÍCIA ──────────────────────────────────────────
// Regra de negócio: se não enviar nova imagem, mantém a atual.
// Novos PDFs são adicionados — não substituem os anteriores.
// Para remover um anexo específico, usar rota DELETE /noticias/anexos/:id.
const editarNoticia = async (id, { titulo, conteudo, categoria, visibilidade, imagemBuffer, imagemMime, anexosFiles }) => {
  const atual = await pool.query(
    'SELECT * FROM noticias WHERE id = $1',
    [id]
  );

  if (atual.rows.length === 0) {
    throw new Error('Notícia não encontrada.');
  }

  // Se não veio nova imagem, mantém a imagem anterior
  const imagem_base64 = imagemBuffer
    ? `data:${imagemMime};base64,${imagemBuffer.toString('base64')}`
    : atual.rows[0].imagem_base64;

  await pool.query(
    `UPDATE noticias
     SET titulo=$1, conteudo=$2, categoria=$3, visibilidade=$4, imagem_base64=$5
     WHERE id=$6`,
    [titulo, conteudo, categoria, visibilidade, imagem_base64, id]
  );

  // Novos PDFs enviados na edição são adicionados ao conjunto
  // de anexos já existente da notícia.
  for (const file of anexosFiles) {
    const dados = file.buffer.toString('base64');
    await pool.query(
      `INSERT INTO noticia_anexos (noticia_id, nome, dados) VALUES ($1, $2, $3)`,
      [id, file.originalname, dados]
    );
  }
};

// ─── BUSCAR ANEXO ────────────────────────────────────────────
// Retorna o registro completo do anexo incluindo dados base64.
// Usado pelo controller para servir o PDF como stream.
const buscarAnexo = async (anexoId) => {
  const result = await pool.query(
    'SELECT id, nome, dados FROM noticia_anexos WHERE id = $1',
    [anexoId]
  );
  return result.rows[0] || null;
};

// ─── EXCLUIR NOTÍCIA ─────────────────────────────────────────
// Remove permanentemente a notícia do banco.
// ON DELETE CASCADE na tabela noticia_anexos garante que todos
// os PDFs vinculados são removidos automaticamente junto.
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
  buscarAnexo,
  excluirNoticia
};