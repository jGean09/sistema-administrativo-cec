const pool = require('../config/database');

// Listar notícias (feed público para sócios logados)
const listar = async (req, res) => {
  const { tipo, departamento, pagina = 1, limite = 10 } = req.query;
  const offset = (pagina - 1) * limite;

  let where = ["n.publicado = true"];
  let params = [];

  // Sócios vêem notícias gerais + as do seu departamento
  if (req.usuario.tipo_usuario === 'socio') {
    where.push(`(n.departamento = 'todos' OR n.departamento = $${params.length + 1})`);
    params.push(req.usuario.departamento);
  } else if (departamento) {
    where.push(`n.departamento = $${params.length + 1}`);
    params.push(departamento);
  }

  if (tipo) {
    where.push(`n.tipo = $${params.length + 1}`);
    params.push(tipo);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  try {
    const [noticias, total] = await Promise.all([
      pool.query(
        `SELECT n.id, n.titulo, n.conteudo, n.tipo, n.departamento,
                n.data_publicacao, s.nome as autor, s.cargo as cargo_autor
         FROM noticias n
         LEFT JOIN socios s ON n.publicado_por = s.id
         ${whereClause}
         ORDER BY n.data_publicacao DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limite, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM noticias n ${whereClause}`, params)
    ]);

    return res.json({
      noticias: noticias.rows,
      total: parseInt(total.rows[0].count),
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total.rows[0].count / limite)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
};

// Publicar nova notícia
const publicar = async (req, res) => {
  const { titulo, conteudo, tipo, departamento = 'todos' } = req.body;

  if (!titulo || !conteudo || !tipo) {
    return res.status(400).json({ error: 'Título, conteúdo e tipo são obrigatórios.' });
  }

  const tiposValidos = ['edital', 'ata_assembleia', 'escala_limpeza', 'relatorio_gastos', 'comunicado', 'noticia_geral'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de publicação inválido.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO noticias (titulo, conteudo, tipo, departamento, publicado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [titulo, conteudo, tipo, departamento, req.usuario.id]
    );

    return res.status(201).json({
      message: 'Publicado com sucesso!',
      noticia: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao publicar.' });
  }
};

// Editar notícia
const editar = async (req, res) => {
  const { id } = req.params;
  const { titulo, conteudo, publicado } = req.body;

  try {
    // Verifica se é o autor ou presidente
    const noticia = await pool.query('SELECT publicado_por FROM noticias WHERE id = $1', [id]);
    if (noticia.rows.length === 0) return res.status(404).json({ error: 'Não encontrada.' });

    const isAutor = noticia.rows[0].publicado_por === req.usuario.id;
    const isAdmin = ['presidente', 'admin'].includes(req.usuario.tipo_usuario);

    if (!isAutor && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para editar esta publicação.' });
    }

    const result = await pool.query(
      `UPDATE noticias SET titulo = COALESCE($1, titulo), conteudo = COALESCE($2, conteudo),
       publicado = COALESCE($3, publicado), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [titulo, conteudo, publicado, id]
    );

    return res.json({ message: 'Atualizado.', noticia: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao editar.' });
  }
};

// Excluir notícia
const excluir = async (req, res) => {
  const { id } = req.params;

  try {
    const noticia = await pool.query('SELECT publicado_por FROM noticias WHERE id = $1', [id]);
    if (noticia.rows.length === 0) return res.status(404).json({ error: 'Não encontrada.' });

    const isAutor = noticia.rows[0].publicado_por === req.usuario.id;
    const isAdmin = ['presidente', 'admin'].includes(req.usuario.tipo_usuario);

    if (!isAutor && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await pool.query('DELETE FROM noticias WHERE id = $1', [id]);
    return res.json({ message: 'Publicação removida.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir.' });
  }
};

const listarPublicas = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, titulo, conteudo as resumo, tipo as categoria, data_publicacao FROM noticias WHERE publicado = true ORDER BY data_publicacao DESC',
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar notícias públicas.' });
  }
};

// Agora o module.exports consegue enxergar todas as constantes
module.exports = { 
  listar, 
  publicar, 
  editar, 
  excluir, 
  listarPublicas 
};