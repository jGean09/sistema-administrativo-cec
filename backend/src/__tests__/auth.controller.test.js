jest.mock('../services/authService', () => ({
  autenticar: jest.fn(),
  buscarPerfil: jest.fn(),
  trocarSenha: jest.fn()
}));

const authService = require('../services/authService');
const authController = require('../controllers/authController');

const mockReq = (body = {}, usuario = {}) => ({
  body,
  usuario
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ─── LOGIN ───────────────────────────────────────────────────
  describe('login', () => {
    test('deve retornar 400 se e-mail ou senha não forem fornecidos', async () => {
      const req = mockReq({ email: 'teste@email.com' }); // Falta senha
      const res = mockRes();

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'E-mail e senha são obrigatórios.' });
    });

    test('deve realizar login com sucesso', async () => {
      authService.autenticar.mockResolvedValue({ token: 'token_fake' });
      const req = mockReq({ email: 'teste@email.com', senha: '123' });
      const res = mockRes();

      await authController.login(req, res);
      expect(res.json).toHaveBeenCalledWith({ token: 'token_fake' });
    });

    test('deve retornar 403 para conta suspensa', async () => {
      authService.autenticar.mockRejectedValue(new Error('SUSPENSO'));
      const req = mockReq({ email: 'suspenso@email.com', senha: '123' });
      const res = mockRes();

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('deve retornar 401 para credenciais incorretas', async () => {
      authService.autenticar.mockRejectedValue(new Error('E-mail ou senha incorretos.'));
      const req = mockReq({ email: 'teste@email.com', senha: 'errada' });
      const res = mockRes();

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('deve retornar 500 para outros erros no login', async () => {
      authService.autenticar.mockRejectedValue(new Error('Erro de banco de dados'));
      const req = mockReq({ email: 'teste@email.com', senha: '123' });
      const res = mockRes();

      await authController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── PERFIL ──────────────────────────────────────────────────
  describe('perfil', () => {
    test('deve retornar dados do perfil com sucesso', async () => {
      const mockPerfil = { id: 1, nome: 'Usuário' };
      authService.buscarPerfil.mockResolvedValue(mockPerfil);
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      await authController.perfil(req, res);
      expect(authService.buscarPerfil).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockPerfil);
    });

    test('deve retornar 500 em caso de erro ao buscar perfil', async () => {
      authService.buscarPerfil.mockRejectedValue(new Error('Erro'));
      const req = mockReq({}, { id: 1 });
      const res = mockRes();

      await authController.perfil(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── TROCAR SENHA ────────────────────────────────────────────
  describe('trocarSenha', () => {
    test('deve retornar 400 se faltar campos', async () => {
      const req = mockReq({ senhaAtual: '123' }); // Falta novaSenha
      const res = mockRes();

      await authController.trocarSenha(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('deve alterar a senha com sucesso', async () => {
      authService.trocarSenha.mockResolvedValue();
      const req = mockReq({ senhaAtual: '123', novaSenha: '123456' }, { id: 1 });
      const res = mockRes();

      await authController.trocarSenha(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Senha alterada com sucesso.' });
    });

    test('deve retornar 401 se senha atual for incorreta', async () => {
      authService.trocarSenha.mockRejectedValue(new Error('Senha atual incorreta.'));
      const req = mockReq({ senhaAtual: 'errada', novaSenha: '123456' }, { id: 1 });
      const res = mockRes();

      await authController.trocarSenha(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('deve retornar 400 se a nova senha não tiver 6 caracteres', async () => {
      authService.trocarSenha.mockRejectedValue(new Error('A senha deve ter pelo menos 6 caracteres.'));
      const req = mockReq({ senhaAtual: '123', novaSenha: '123' }, { id: 1 });
      const res = mockRes();

      await authController.trocarSenha(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('deve retornar 500 para outros erros na troca de senha', async () => {
      authService.trocarSenha.mockRejectedValue(new Error('Erro no DB'));
      const req = mockReq({ senhaAtual: '123', novaSenha: '123456' }, { id: 1 });
      const res = mockRes();

      await authController.trocarSenha(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});