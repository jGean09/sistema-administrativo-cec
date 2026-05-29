jest.mock('../services/noticiaService', () => ({
  listarPublicas: jest.fn(),
  listar: jest.fn(),
  publicarNoticia: jest.fn(),
  editarNoticia: jest.fn(),
  excluirNoticia: jest.fn()
}));

const noticiaService = require('../services/noticiaService');
const noticiaController = require('../controllers/noticiaController');

const mockReq = ({ body = {}, params = {}, query = {}, file = null, usuario = {} } = {}) => ({
  body,
  params,
  query,
  file,
  usuario
});

const mockRes = () => {
  const res = {};
  res.set = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('NoticiaController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ─── LISTAR PÚBLICAS ─────────────────────────────────────────
  describe('listarPublicas', () => {
    test('deve listar notícias públicas com sucesso', async () => {
      const mockNoticias = [{ id: 1, titulo: 'Notícia' }];
      noticiaService.listarPublicas.mockResolvedValue(mockNoticias);
      const req = mockReq({ query: { pagina: 1 } });
      const res = mockRes();

      await noticiaController.listarPublicas(req, res);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(noticiaService.listarPublicas).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(mockNoticias);
    });

    test('deve retornar 500 em caso de erro ao listar públicas', async () => {
      noticiaService.listarPublicas.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq();
      const res = mockRes();

      await noticiaController.listarPublicas(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── LISTAR PARA SÓCIOS ──────────────────────────────────────
  describe('listar', () => {
    test('deve listar notícias do feed interno com sucesso', async () => {
      const mockNoticias = [{ id: 2, titulo: 'Aviso Interno' }];
      noticiaService.listar.mockResolvedValue(mockNoticias);
      const req = mockReq();
      const res = mockRes();

      await noticiaController.listar(req, res);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(res.json).toHaveBeenCalledWith(mockNoticias);
    });

    test('deve retornar 500 em caso de erro ao listar para sócios', async () => {
      noticiaService.listar.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq();
      const res = mockRes();

      await noticiaController.listar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── PUBLICAR ────────────────────────────────────────────────
  describe('publicar', () => {
    test('deve publicar notícia COM imagem com sucesso', async () => {
      const mockResult = { id: 1, titulo: 'Teste' };
      noticiaService.publicarNoticia.mockResolvedValue(mockResult);
      
      const req = mockReq({
        body: { titulo: 'Teste', conteudo: 'Texto' },
        file: { filename: 'imagem.jpg' },
        usuario: { id: 10, nome: 'João' }
      });
      const res = mockRes();

      await noticiaController.publicar(req, res);

      expect(noticiaService.publicarNoticia).toHaveBeenCalledWith({
        titulo: 'Teste',
        conteudo: 'Texto',
        imagem_url: '/uploads/imagem.jpg', // Verifica se montou a URL certa
        autor_id: 10,
        autor_nome: 'João'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('deve publicar notícia SEM imagem com sucesso', async () => {
      noticiaService.publicarNoticia.mockResolvedValue({ id: 2 });
      
      const req = mockReq({
        body: { titulo: 'Sem Foto' },
        usuario: { id: 10, nome: 'João' }
        // file propositalmente não enviado (null)
      });
      const res = mockRes();

      await noticiaController.publicar(req, res);

      // Verifica se mandou null na imagem_url
      expect(noticiaService.publicarNoticia).toHaveBeenCalledWith(
        expect.objectContaining({ imagem_url: null })
      );
    });

    test('deve retornar 400 se faltar título ou conteúdo', async () => {
      noticiaService.publicarNoticia.mockRejectedValue(new Error('Título e conteúdo são obrigatórios.'));
      const req = mockReq({ usuario: {} });
      const res = mockRes();

      await noticiaController.publicar(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('deve retornar 500 para outros erros', async () => {
      noticiaService.publicarNoticia.mockRejectedValue(new Error('Falha no upload'));
      const req = mockReq({ usuario: {} });
      const res = mockRes();

      await noticiaController.publicar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── EDITAR ──────────────────────────────────────────────────
  describe('editar', () => {
    test('deve editar a notícia e manter a nova imagem caso enviada', async () => {
      noticiaService.editarNoticia.mockResolvedValue();
      const req = mockReq({
        params: { id: 1 },
        body: { titulo: 'Atualizado' },
        file: { filename: 'nova_foto.png' }
      });
      const res = mockRes();

      await noticiaController.editar(req, res);

      expect(noticiaService.editarNoticia).toHaveBeenCalledWith(1, {
        titulo: 'Atualizado',
        imagem_url: '/uploads/nova_foto.png'
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Notícia atualizada.' });
    });

    test('deve editar a notícia SEM enviar imagem (null)', async () => {
      noticiaService.editarNoticia.mockResolvedValue();
      const req = mockReq({ params: { id: 1 }, body: { titulo: 'Atualizado' } });
      const res = mockRes();

      await noticiaController.editar(req, res);
      expect(noticiaService.editarNoticia).toHaveBeenCalledWith(1, expect.objectContaining({ imagem_url: null }));
    });

    test('deve retornar 404 se a notícia não for encontrada', async () => {
      noticiaService.editarNoticia.mockRejectedValue(new Error('Notícia não encontrada.'));
      const req = mockReq({ params: { id: 99 } });
      const res = mockRes();

      await noticiaController.editar(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('deve retornar 500 para erros no banco', async () => {
      noticiaService.editarNoticia.mockRejectedValue(new Error('Erro no DB'));
      const req = mockReq({ params: { id: 1 } });
      const res = mockRes();

      await noticiaController.editar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── EXCLUIR ─────────────────────────────────────────────────
  describe('excluir', () => {
    test('deve excluir a notícia com sucesso', async () => {
      noticiaService.excluirNoticia.mockResolvedValue();
      const req = mockReq({ params: { id: 1 } });
      const res = mockRes();

      await noticiaController.excluir(req, res);
      expect(noticiaService.excluirNoticia).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notícia excluída.' });
    });

    test('deve retornar 500 em caso de erro ao excluir', async () => {
      noticiaService.excluirNoticia.mockRejectedValue(new Error('Erro de chave estrangeira'));
      const req = mockReq({ params: { id: 1 } });
      const res = mockRes();

      await noticiaController.excluir(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});