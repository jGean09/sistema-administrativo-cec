// Mock do upload configurado para ler uma propriedade "simularErro" do req
jest.mock('../config/upload', () => ({
  single: jest.fn(() => (req, res, next) => {
    if (req.simularErro === 'LIMIT_FILE_SIZE') {
      return next({ code: 'LIMIT_FILE_SIZE' });
    }
    if (req.simularErro === 'ERRO_GENERICO') {
      return next(new Error('Erro no multer'));
    }
    return next();
  })
}));

// Mock dos controllers
jest.mock('../controllers/authController', () => ({ login: jest.fn(), perfil: jest.fn(), trocarSenha: jest.fn() }));
jest.mock('../controllers/socioController', () => ({ cadastrar: jest.fn(), listar: jest.fn(), buscarPorId: jest.fn(), atualizar: jest.fn() }));
jest.mock('../controllers/noticiaController', () => ({ listarPublicas: jest.fn(), listar: jest.fn(), publicar: jest.fn(), editar: jest.fn(), excluir: jest.fn() }));
jest.mock('../controllers/fichaController', () => ({ gerarFicha: jest.fn() }));

// Mock dos middlewares
jest.mock('../middlewares/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => next()),
  exigeDiretoria: jest.fn((req, res, next) => next()),
  exigePresidente: jest.fn((req, res, next) => next()),
  podeCadastrarSocio: jest.fn((req, res, next) => next())
}));

const router = require('../routes/index');

describe('Router Index', () => {
  test('deve exportar o router do express com as rotas configuradas', () => {
    expect(typeof router).toBe('function');
    expect(router.stack.length).toBeGreaterThan(0);
  });

  describe('Tratamento de erros de Upload (Linhas 35-38, 43-46)', () => {
    // Acessa diretamente as rotas dentro da instância do router do Express
    const routes = router.stack.filter(layer => layer.route);
    const postNoticia = routes.find(r => r.route.path === '/noticias' && r.route.methods.post);
    const putNoticia = routes.find(r => r.route.path === '/noticias/:id' && r.route.methods.put);

    // O middleware inline que verifica o erro do multer é o 3º (índice 2) na sua rota
    const uploadMiddlewarePost = postNoticia.route.stack[2].handle;
    const uploadMiddlewarePut = putNoticia.route.stack[2].handle;

    test('deve retornar 400 se a imagem exceder o tamanho no POST', () => {
      const req = { simularErro: 'LIMIT_FILE_SIZE' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
      uploadMiddlewarePost(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Imagem muito grande. Máximo 10MB.' });
    });

    test('deve retornar 400 para erros gerais do multer no PUT', () => {
      const req = { simularErro: 'ERRO_GENERICO' };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
      uploadMiddlewarePut(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro no multer' });
    });

    test('deve chamar next() se não houver erro no upload', () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      
      uploadMiddlewarePost(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});