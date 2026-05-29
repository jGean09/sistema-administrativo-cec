// ATENÇÃO: Mockamos apenas o SERVICE. Nunca o Controller!
jest.mock('../services/socioService', () => ({
  listarSocios: jest.fn(),
  cadastrarSocio: jest.fn(),
  buscarSocioPorId: jest.fn(),
  atualizarSocio: jest.fn()
}));

const socioService = require('../services/socioService');
const socioController = require('../controllers/socioController');

const mockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('SocioController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ─── LISTAR ──────────────────────────────────────────────────
  describe('listar', () => {
    test('deve listar os sócios com sucesso', async () => {
      const mockResultado = [{ id: 1, nome: 'José Gean' }];
      socioService.listarSocios.mockResolvedValue(mockResultado);
      
      const req = mockReq({}, {}, { status: 'ativo' });
      const res = mockRes();

      await socioController.listar(req, res);
      
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(socioService.listarSocios).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith(mockResultado);
    });

    test('deve retornar 500 em caso de erro ao listar', async () => {
      socioService.listarSocios.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq();
      const res = mockRes();

      await socioController.listar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── CADASTRAR ───────────────────────────────────────────────
  describe('cadastrar', () => {
    test('deve cadastrar sócio com sucesso', async () => {
      const mockSocio = { id: 1, nome: 'Novo Sócio' };
      socioService.cadastrarSocio.mockResolvedValue(mockSocio);
      
      const req = mockReq({ nome: 'Novo Sócio' });
      const res = mockRes();

      await socioController.cadastrar(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Sócio cadastrado com sucesso!',
        socio: mockSocio
      });
    });

    test('deve retornar 409 se usuário já for cadastrado', async () => {
      socioService.cadastrarSocio.mockRejectedValue(new Error('Sócio já cadastrado no sistema.'));
      const req = mockReq({ nome: 'Duplicado' });
      const res = mockRes();

      await socioController.cadastrar(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('deve retornar 500 para outros erros ao cadastrar', async () => {
      socioService.cadastrarSocio.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq({ nome: 'Erro' });
      const res = mockRes();

      await socioController.cadastrar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── BUSCAR POR ID ───────────────────────────────────────────
  describe('buscarPorId', () => {
    test('deve buscar sócio com sucesso', async () => {
      const mockSocio = { id: 1, nome: 'José Gean' };
      socioService.buscarSocioPorId.mockResolvedValue(mockSocio);
      
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      await socioController.buscarPorId(req, res);
      expect(res.json).toHaveBeenCalledWith(mockSocio);
    });

    test('deve retornar 404 se sócio não for encontrado', async () => {
      socioService.buscarSocioPorId.mockRejectedValue(new Error('Sócio não encontrado.'));
      const req = mockReq({}, { id: 99 });
      const res = mockRes();

      await socioController.buscarPorId(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('deve retornar 500 para outros erros na busca', async () => {
      socioService.buscarSocioPorId.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      await socioController.buscarPorId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── ATUALIZAR ───────────────────────────────────────────────
  describe('atualizar', () => {
    test('deve atualizar sócio com sucesso', async () => {
      socioService.atualizarSocio.mockResolvedValue();
      const req = mockReq({ nome: 'Atualizado' }, { id: 1 });
      const res = mockRes();

      await socioController.atualizar(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Sócio atualizado com sucesso!' });
    });

    test('deve retornar 500 em caso de erro ao atualizar', async () => {
      socioService.atualizarSocio.mockRejectedValue(new Error('Erro DB'));
      const req = mockReq({ nome: 'Atualizado' }, { id: 1 });
      const res = mockRes();

      await socioController.atualizar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});