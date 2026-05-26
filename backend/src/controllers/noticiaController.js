const pool = require('../config/database');

const listarPublicas = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { categoria } = req.query;
  let where = `WHERE visibilidade = 'publica'`;
  const params = [];
  if (categoria) { where += ` AND categoria = $1`; params.push(categoria); }

  try {
    const result = await pool.query(
      `SELECT id, titulo, conteudo, categoria, imagem_url, autor_nome, created_at
       FROM noticias ${where} ORDER BY created_at DESC LIMIT 20`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
};

const listar = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { categoria } = req.query;
  let where = `WHERE (visibilidade = 'publica' OR visibilidade = 'socios')`;
  const params = [];
  if (categoria) { where += ` AND categoria = $1`; params.push(categoria); }

  try {
    const result = await pool.query(
      `SELECT id, titulo, conteudo, categoria, visibilidade, imagem_url, autor_nome, created_at
       FROM noticias ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
};

const publicar = async (req, res) => {
  const { titulo, conteudo, categoria, visibilidade } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;
  const autor_nome = req.usuario.nome;
  const autor_id = req.usuario.id;

  if (!titulo || !conteudo) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });

  try {
    const result = await pool.query(
      `INSERT INTO noticias (titulo, conteudo, categoria, visibilidade, imagem_url, autor_id, autor_nome)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [titulo, conteudo, categoria || 'aviso', visibilidade || 'publica', imagem_url, autor_id, autor_nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao publicar notícia.' });
  }
};

const editar = async (req, res) => {
  const { id } = req.params;
  const { titulo, conteudo, categoria, visibilidade } = req.body;
  const imagem_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const atual = await pool.query('SELECT * FROM noticias WHERE id = $1', [id]);
    if (atual.rows.length === 0) return res.status(404).json({ error: 'Notícia não encontrada.' });

    const nova_imagem = imagem_url || atual.rows[0].imagem_url;

    await pool.query(
      `UPDATE noticias SET titulo=$1, conteudo=$2, categoria=$3, visibilidade=$4, imagem_url=$5
       WHERE id=$6`,
      [titulo, conteudo, categoria, visibilidade, nova_imagem, id]
    );
    res.json({ message: 'Notícia atualizada.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar notícia.' });
  }
};

const excluir = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM noticias WHERE id = $1', [id]);
    res.json({ message: 'Notícia excluída.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir notícia.' });
  }
};

module.exports = { listarPublicas, listar, publicar, editar, excluir };