// Mock do Express para impedir o app.listen de travar a porta real no Jest
jest.mock('express', () => {
  const mockApp = {
    disable: jest.fn(),
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port, cb) => {
      if (cb) cb(); // Executa o callback do console.log
    }),
  };
  const mockExpress = jest.fn(() => mockApp);
  mockExpress.json = jest.fn(() => 'json_middleware');
  mockExpress.urlencoded = jest.fn(() => 'urlencoded_middleware');
  mockExpress.static = jest.fn(() => 'static_middleware');
  return mockExpress;
});

jest.mock('cors', () => jest.fn(() => 'cors_middleware'));
jest.mock('../routes', () => 'routes_mock');

describe('Server.js', () => {
  let app;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Limpa o require cache
    process.env = { ...originalEnv }; // Clona o .env
    
    // Silencia os logs do console durante os testes
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    process.env = originalEnv;
  });

  test('deve configurar middlewares e rotas globais', () => {
    app = require('../server');
    
    expect(app.disable).toHaveBeenCalledWith('x-powered-by');
    expect(app.use).toHaveBeenCalledWith('cors_middleware');
    expect(app.use).toHaveBeenCalledWith('json_middleware');
    expect(app.use).toHaveBeenCalledWith('urlencoded_middleware');
    expect(app.use).toHaveBeenCalledWith('/api', 'routes_mock');
    expect(app.listen).toHaveBeenCalled();
  });

  test('deve acionar o log de requisição se estiver em development', () => {
    process.env.NODE_ENV = 'development';
    
    // Importa o server de forma isolada para testar o bloco IF de development
    jest.isolateModules(() => {
      const devApp = require('../server');
      
      // Localiza o middleware anônimo do log (tem 3 parâmetros: req, res, next)
      const logMiddlewareCall = devApp.use.mock.calls.find(call => 
        call.length === 1 && typeof call[0] === 'function' && call[0].length === 3
      );
      const logHandler = logMiddlewareCall[0];

      const req = { method: 'GET', path: '/teste' };
      const res = {};
      const next = jest.fn();

      logHandler(req, res, next);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('['));
      expect(next).toHaveBeenCalled();
    });
  });

  test('deve responder com status ok na rota /health', () => {
    app = require('../server');
    
    // Extrai o handler anônimo atrelado à rota /health
    const healthCall = app.get.mock.calls.find(call => call[0] === '/health');
    const healthHandler = healthCall[1];

    const req = {};
    const res = { json: jest.fn() };

    healthHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: 'ok',
      sistema: 'CEC - Casa do Estudante de Caicó',
      versao: '1.0.0'
    });
  });

  test('deve interceptar erro 404', () => {
    app = require('../server');
    
    // Handler 404 é um use sem rota definida e com 2 parâmetros (req, res)
    const notFoundCall = app.use.mock.calls.find(call => 
      call.length === 1 && typeof call[0] === 'function' && call[0].length === 2
    );
    const notFoundHandler = notFoundCall[0];

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Rota não encontrada.' });
  });

  test('deve interceptar erro global (500)', () => {
    app = require('../server');
    
    // Handler de erro 500 é um use com 4 parâmetros (err, req, res, next)
    const errorCall = app.use.mock.calls.find(call => 
      call.length === 1 && typeof call[0] === 'function' && call[0].length === 4
    );
    const errorHandler = errorCall[0];

    const err = new Error('Falha catastrófica');
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith('Erro não tratado:', err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor.' });
  });
});