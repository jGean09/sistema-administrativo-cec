const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const emailController = require('../controllers/emailController');


// Agrupe todos os middlewares aqui e remova os outros requires de auth lá de baixo
const { 
  authMiddleware, 
  exigeDiretoria, 
  exigePresidente, 
  podeCadastrarSocio 
} = require('../middlewares/auth');

const authController = require('../controllers/authController');
const socioController = require('../controllers/socioController');
const noticiaController = require('../controllers/noticiaController');

// ─── AUTH ────────────────────────────────────────────────────────────
router.post('/auth/login', authController.login);
router.get('/auth/perfil', authMiddleware, authController.perfil);
router.put('/auth/senha', authMiddleware, authController.trocarSenha);

// ─── SÓCIOS ──────────────────────────────────────────────────────────
// Rota de cadastro movida para dentro da proteção da diretoria
router.post('/socios', authMiddleware, podeCadastrarSocio, socioController.cadastrar);
router.get('/socios', authMiddleware, exigeDiretoria, socioController.listar);
router.get('/socios/:id', authMiddleware, socioController.buscarPorId);
router.put('/socios/:id', authMiddleware, socioController.atualizar);



// ─── NOTÍCIAS ────────────────────────────────────────────────────────
router.get('/public/noticias', noticiaController.listarPublicas);
router.get('/noticias', authMiddleware, noticiaController.listar);

router.post('/noticias', authMiddleware, exigeDiretoria, (req, res, next) => {
  upload.single('imagem')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Imagem muito grande. Máximo 10MB.' });
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, noticiaController.publicar);

router.put('/noticias/:id', authMiddleware, exigeDiretoria, (req, res, next) => {
  upload.single('imagem')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Imagem muito grande. Máximo 10MB.' });
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, noticiaController.editar);

router.delete('/noticias/:id', authMiddleware, exigeDiretoria, noticiaController.excluir);

// ─── FICHA DO SÓCIO ─────────────────────────────────────────────────
const fichaController = require('../controllers/fichaController');
router.get('/socios/:id/ficha', fichaController.gerarFicha);
// ─── DECLARAÇÃO DO SÓCIO ────────────────────────────────────────────
const declaracaoController = require('../controllers/declaracaoController');
router.get('/socios/:id/declaracao', declaracaoController.gerarDeclaracao);

// ─── E-MAIL ──────────────────────────────────────────────────
// Sem upload aqui — o controller já gerencia o multer internamente
router.get('/email/destinatarios', authMiddleware, exigeDiretoria, emailController.listarDestinatarios);
router.post('/email/enviar', authMiddleware, exigeDiretoria, emailController.enviar);
module.exports = router;