// ============================================================
// PADRÃO: MVC — Controller de Notícias
// SOLID S — Single Responsibility: só coordena requisições
//           de notícias. Toda lógica está no noticiaService.
// GRASP Controller: recebe HTTP, chama serviço, responde.
// ============================================================

const noticiaService = require('../services/noticiaService');

// ─── LISTAR PÚBLICAS ─────────────────────────────────────────
// Rota pública — sem autenticação (landing page)
const listarPublicas = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const noticias = await noticiaService.listarPublicas(req.query);
    res.json(noticias);
  } catch (err) {
    console.error('[listar notícias públicas]', err);
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
};

// ─── LISTAR PARA SÓCIOS ──────────────────────────────────────
// Rota protegida — requer autenticação (feed interno)
const listar = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const noticias = await noticiaService.listar(req.query);
    res.json(noticias);
  } catch (err) {
    console.error('[listar notícias sócios]', err);
    res.status(500).json({ error: 'Erro ao buscar notícias.' });
  }
};

// ─── PUBLICAR ────────────────────────────────────────────────
// req.file vem do multer (upload de imagem)
// req.usuario vem do authMiddleware (token JWT)
const publicar = async (req, res) => {
  try {
    const noticia = await noticiaService.publicarNoticia({
      ...req.body,
      // Se enviou imagem, monta o caminho; senão null
      imagem_url: req.file ? `/uploads/${req.file.filename}` : null,
      autor_id: req.usuario.id,
      autor_nome: req.usuario.nome,
    });
    res.status(201).json(noticia);
  } catch (err) {
    console.error('[publicar notícia]', err);
    if (err.message === 'Título e conteúdo são obrigatórios.') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao publicar notícia.' });
  }
};

// ─── EDITAR ──────────────────────────────────────────────────
const editar = async (req, res) => {
  try {
    await noticiaService.editarNoticia(req.params.id, {
      ...req.body,
      imagem_url: req.file ? `/uploads/${req.file.filename}` : null,
    });
    res.json({ message: 'Notícia atualizada.' });
  } catch (err) {
    console.error('[editar notícia]', err);
    if (err.message === 'Notícia não encontrada.') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao editar notícia.' });
  }
};

// ─── EXCLUIR ─────────────────────────────────────────────────
const excluir = async (req, res) => {
  try {
    await noticiaService.excluirNoticia(req.params.id);
    res.json({ message: 'Notícia excluída.' });
  } catch (err) {
    console.error('[excluir notícia]', err);
    res.status(500).json({ error: 'Erro ao excluir notícia.' });
  }
};

module.exports = { listarPublicas, listar, publicar, editar, excluir };