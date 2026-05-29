// Mock do on() para capturarmos os eventos 'connect' e 'error'
const mockOn = jest.fn();

jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => ({
      on: mockOn
    }))
  };
});

describe('Database Config', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Força o require a reavaliar o arquivo em cada teste
    
    // Silencia os logs e bloqueia o fechamento do Node.js durante o teste
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  test('deve instanciar o Pool do pg e registrar os listeners de eventos', () => {
    require('../config/database');
    const { Pool } = require('pg');
    
    expect(Pool).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('deve exibir log de sucesso ao conectar no banco', () => {
    require('../config/database');
    
    // Encontra o callback anônimo que foi passado para o evento 'connect'
    const connectCallback = mockOn.mock.calls.find(call => call[0] === 'connect')[1];
    
    // Executa a função manualmente
    connectCallback();
    
    expect(consoleLogSpy).toHaveBeenCalledWith('Conectado ao banco de dados PostgreSQL');
  });

  test('deve exibir log de erro e encerrar a aplicação em caso de falha', () => {
    require('../config/database');
    
    // Encontra o callback anônimo que foi passado para o evento 'error'
    const errorCallback = mockOn.mock.calls.find(call => call[0] === 'error')[1];
    const erroSimulado = new Error('Falha de rede');

    // Executa a função simulando uma queda de conexão
    errorCallback(erroSimulado);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Erro na conexão com o banco:', erroSimulado);
    expect(processExitSpy).toHaveBeenCalledWith(-1);
  });
});