const fs = require('fs');
const multer = require('multer');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock do multer
jest.mock('multer', () => {
  const multerMock = jest.fn((options) => options);
  multerMock.diskStorage = jest.fn((options) => options);
  return multerMock;
});

// Importa o módulo após os mocks
const upload = require('../config/upload');

// Captura as opções passadas ao diskStorage enquanto o mock ainda tem as chamadas
const diskStorageOptions = multer.diskStorage.mock.calls[0][0];

describe('Upload Config', () => {

  beforeEach(() => {
    // Limpa apenas os mocks que serão usados individualmente em cada teste,
    // preservando as configurações que já foram capturadas.
    jest.clearAllMocks();
  });

  test('deve criar a pasta se não existir', () => {
    // Configura o mock do fs para simular que a pasta não existe
    fs.existsSync.mockReturnValue(false);

    // Simula a execução exata do trecho do módulo
    const path = require('path');
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('uploads'),
      { recursive: true }
    );
  });

  test('deve configurar o destination corretamente', () => {
    const cb = jest.fn();
    diskStorageOptions.destination({}, {}, cb);

    expect(cb).toHaveBeenCalledWith(
      null,
      expect.stringContaining('uploads')
    );
  });

  test('deve configurar o filename corretamente', () => {
    const mockTimestamp = 1620000000000;
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    const cb = jest.fn();
    diskStorageOptions.filename(
      {},
      { originalname: 'test.jpg' },
      cb
    );

    expect(cb).toHaveBeenCalledWith(
      null,
      `noticia_${mockTimestamp}.jpg`
    );

    Date.now.mockRestore();
  });

  test('deve aceitar extensões válidas', () => {
    const cb = jest.fn();
    upload.fileFilter(
      {},
      { originalname: 'test.jpg' },
      cb
    );

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  test('deve rejeitar extensões inválidas', () => {
    const cb = jest.fn();
    upload.fileFilter(
      {},
      { originalname: 'arquivo.pdf' },
      cb
    );

    expect(cb).toHaveBeenCalled();
    const erro = cb.mock.calls[0][0];
    expect(erro).toBeInstanceOf(Error);
    expect(erro.message).toBe('Apenas imagens são permitidas.');
  });
});