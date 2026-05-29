jest.mock('../services/fichaService', () => ({
  gerarFicha: jest.fn()
}));

const fichaService = require('../services/fichaService');
const fichaController = require('../controllers/fichaController');

const mockReq = (params = {}) => ({
  params
});

const mockRes = () => {
  const res = {
    headersSent: false
  };
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('FichaController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('gerarFicha', () => {
    test('deve gerar o PDF da ficha com sucesso e fazer o pipe na resposta', async () => {
      // Cria um mock para simular o documento PDF que tem um método pipe
      const mockDoc = { pipe: jest.fn() };
      fichaService.gerarFicha.mockResolvedValue(mockDoc);

      const req = mockReq({ id: '123' });
      const res = mockRes();

      await fichaController.gerarFicha(req, res);

      // Verifica se os headers do PDF foram configurados corretamente
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="ficha_123.pdf"');
      
      expect(fichaService.gerarFicha).toHaveBeenCalledWith('123');
      expect(mockDoc.pipe).toHaveBeenCalledWith(res);
    });

    test('deve retornar 404 quando o sócio não for encontrado', async () => {
      fichaService.gerarFicha.mockRejectedValue(new Error('Sócio não encontrado.'));
      
      const req = mockReq({ id: '999' });
      const res = mockRes();

      await fichaController.gerarFicha(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Sócio não encontrado.' });
    });

    test('deve retornar 500 para outros erros se os headers ainda não tiverem sido enviados', async () => {
      fichaService.gerarFicha.mockRejectedValue(new Error('Erro na biblioteca PDF'));
      
      const req = mockReq({ id: '123' });
      const res = mockRes();
      // headersSent = false por padrão no mockRes

      await fichaController.gerarFicha(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao gerar ficha.' });
    });

    test('não deve retornar 500 se o erro ocorrer após o envio dos headers', async () => {
      fichaService.gerarFicha.mockRejectedValue(new Error('Erro stream PDF quebrado na metade'));
      
      const req = mockReq({ id: '123' });
      const res = mockRes();
      res.headersSent = true; // Simula que os headers HTTP já saíram

      await fichaController.gerarFicha(req, res);

      // Como os headers já foram enviados, ele não deve tentar mandar um status 500
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});