jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  authMiddleware,
  exigeDiretoria,
  exigePresidente,
  podeCadastrarSocio
} = require('../middlewares/auth');

const mockReq = (headers = {}, usuario = null) => ({
  headers,
  usuario
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

// ============================================================
// CONFIGURAÇÃO GLOBAL DOS TESTES
// ============================================================
beforeEach(() => {
  jest.clearAllMocks();
  // Silencia o console.error para não poluir o terminal durante simulações de erro
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restaura o comportamento original do console.error após cada teste
  console.error.mockRestore();
});

// ============================================================
// TESTES: authMiddleware
// ============================================================
describe('authMiddleware', () => {

  test('deve chamar next() quando token é válido e usuário existe', async () => {
    // jwt.verify retorna o payload decodificado
    jwt.verify.mockReturnValueOnce({ id: 1, tipo_usuario: 'socio' });

    // pool.query retorna o usuário do banco
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        nome: 'José Gean',
        tipo_usuario: 'presidente',
        status_socio: 'ativo'
      }]
    });

    const req = mockReq({ authorization: 'Bearer token_valido' });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario.nome).toBe('José Gean');
  });

  test('deve retornar 401 quando token não é fornecido', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 401 quando token é inválido', async () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Token inválido');
    });

    const req = mockReq({ authorization: 'Bearer token_invalido' });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 401 quando usuário não existe no banco', async () => {
    jwt.verify.mockReturnValueOnce({ id: 999 });
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = mockReq({ authorization: 'Bearer token_valido' });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 quando conta está suspensa', async () => {
    jwt.verify.mockReturnValueOnce({ id: 1 });
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, status_socio: 'suspenso' }]
    });

    const req = mockReq({ authorization: 'Bearer token_valido' });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});

// ============================================================
// TESTES: exigeDiretoria
// ============================================================
describe('exigeDiretoria', () => {

  test('deve chamar next() para presidente', () => {
    const req = mockReq({}, { tipo_usuario: 'presidente' });
    const res = mockRes();
    const next = mockNext();
    exigeDiretoria(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para diretoria', () => {
    const req = mockReq({}, { tipo_usuario: 'diretoria' });
    const res = mockRes();
    const next = mockNext();
    exigeDiretoria(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para admin', () => {
    const req = mockReq({}, { tipo_usuario: 'admin' });
    const res = mockRes();
    const next = mockNext();
    exigeDiretoria(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve retornar 403 para sócio comum', () => {
    const req = mockReq({}, { tipo_usuario: 'socio' });
    const res = mockRes();
    const next = mockNext();
    exigeDiretoria(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 para secretario', () => {
    const req = mockReq({}, { tipo_usuario: 'secretario' });
    const res = mockRes();
    const next = mockNext();
    exigeDiretoria(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});

// ============================================================
// TESTES: exigePresidente
// ============================================================
describe('exigePresidente', () => {

  test('deve chamar next() para presidente', () => {
    const req = mockReq({}, { tipo_usuario: 'presidente' });
    const res = mockRes();
    const next = mockNext();
    exigePresidente(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para admin', () => {
    const req = mockReq({}, { tipo_usuario: 'admin' });
    const res = mockRes();
    const next = mockNext();
    exigePresidente(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve retornar 403 para secretario', () => {
    const req = mockReq({}, { tipo_usuario: 'secretario' });
    const res = mockRes();
    const next = mockNext();
    exigePresidente(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 para diretoria', () => {
    const req = mockReq({}, { tipo_usuario: 'diretoria' });
    const res = mockRes();
    const next = mockNext();
    exigePresidente(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});

// ============================================================
// TESTES: podeCadastrarSocio
// Verifica pelo campo 'cargo' (texto) conforme o auth.js real
// ============================================================
describe('podeCadastrarSocio', () => {

  test('deve chamar next() para presidente (tipo_usuario)', () => {
    const req = mockReq({}, { tipo_usuario: 'presidente', cargo: null });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para admin (tipo_usuario)', () => {
    const req = mockReq({}, { tipo_usuario: 'admin', cargo: null });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para Secretário Geral (cargo)', () => {
    // podeCadastrarSocio verifica o campo cargo, não tipo_usuario
    const req = mockReq({}, { tipo_usuario: 'diretoria', cargo: 'Secretário Geral' });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve chamar next() para Vice-Presidente (cargo)', () => {
    const req = mockReq({}, { tipo_usuario: 'diretoria', cargo: 'Vice-Presidente' });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('deve retornar 403 para diretoria sem cargo especial', () => {
    const req = mockReq({}, { tipo_usuario: 'diretoria', cargo: 'Diretor de Tesouraria' });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 403 para sócio comum', () => {
    const req = mockReq({}, { tipo_usuario: 'socio', cargo: null });
    const res = mockRes();
    const next = mockNext();
    podeCadastrarSocio(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});