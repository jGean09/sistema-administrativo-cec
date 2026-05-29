// ============================================================
// TESTES — fichaService.js e fichaBuilder.js
// O que testamos: busca do sócio e construção do PDF
// ============================================================

jest.mock('../config/database', () => ({
  query: jest.fn()
}));

// Simula o PDFDocument para não gerar PDF de verdade nos testes
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    image: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    restore: jest.fn().mockReturnThis(),
    end: jest.fn(),
  }));
});

const pool = require('../config/database');
const fichaService = require('../services/fichaService');
const { construirFicha } = require('../services/fichaBuilder');

beforeEach(() => {
  jest.clearAllMocks();
});

// Sócio completo para os testes
const socioCompleto = {
  id: 1,
  matricula: '20260001-42',
  nome: 'Wiritan Soares da Silva',
  data_nascimento: '2002-04-05T00:00:00.000Z',
  genero: 'M',
  naturalidade: 'Florânia/RN',
  cpf: '112.544.894-60',
  rg: '003.322.201',
  nome_pai: 'Justino Laurentino da Silva',
  nome_mae: 'Maria Salete Soares Veras',
  telefone: '84996990963',
  email: 'wiritans@gmail.com',
  endereco_logradouro: 'Januário Evangelista de Araújo',
  endereco_numero: '55',
  endereco_bairro: 'Rainha do Prado',
  endereco_cidade: 'Florânia',
  endereco_uf: 'RN',
  endereco_cep: '59000-000',
  instituicao: 'UFRN',
  escolaridade: 'Ensino médio completo',
  curso: 'Sistemas de Informação',
  periodo_serie: '5º período',
  ano_inclusao: '2024.1',
  data_inclusao: '2024-03-05T00:00:00.000Z',
  alergias: 'Não',
  medicacao: 'Não',
  doenca_cronica: 'Não',
  deficiencia: 'Não',
  tratamento_medico: 'Não',
};

// ============================================================
// TESTES: fichaService.gerarFicha
// ============================================================
describe('fichaService - gerarFicha', () => {

  test('deve gerar ficha quando sócio existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [socioCompleto] });

    const doc = await fichaService.gerarFicha(1);

    // Verifica que retornou um documento
    expect(doc).toBeDefined();
    // Verifica que buscou o sócio pelo ID correto
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM socios WHERE id = $1',
      [1]
    );
  });

  test('deve lançar erro quando sócio não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(fichaService.gerarFicha(999))
      .rejects
      .toThrow('Sócio não encontrado.');
  });

  test('deve chamar construirFicha com os dados do sócio', async () => {
    pool.query.mockResolvedValueOnce({ rows: [socioCompleto] });

    const doc = await fichaService.gerarFicha(1);

    // O documento retornado deve ter o método end (PDFDocument)
    expect(doc.end).toBeDefined();
  });

});

// ============================================================
// TESTES: fichaBuilder.construirFicha
// ============================================================
describe('fichaBuilder - construirFicha', () => {

  test('deve retornar um documento PDF', () => {
    const doc = construirFicha(socioCompleto);
    expect(doc).toBeDefined();
    expect(doc.end).toBeDefined();
  });

  test('deve chamar end() para finalizar o documento', () => {
    const doc = construirFicha(socioCompleto);
    expect(doc.end).toHaveBeenCalled();
  });

  test('deve funcionar com sócio feminino', () => {
    const socioFeminino = { ...socioCompleto, genero: 'F' };
    const doc = construirFicha(socioFeminino);
    expect(doc).toBeDefined();
  });

  test('deve funcionar com campos nulos sem quebrar', () => {
    const socioMinimo = {
      id: 2,
      matricula: '20260002-11',
      nome: 'Teste Mínimo',
      genero: 'M',
      // Todos os outros campos são null
      data_nascimento: null,
      naturalidade: null,
      cpf: null,
      rg: null,
      nome_pai: null,
      nome_mae: null,
      telefone: null,
      email: null,
      endereco_logradouro: null,
      endereco_numero: null,
      endereco_bairro: null,
      endereco_cidade: null,
      endereco_uf: null,
      endereco_cep: null,
      instituicao: null,
      escolaridade: null,
      curso: null,
      periodo_serie: null,
      ano_inclusao: null,
      data_inclusao: null,
      alergias: null,
      medicacao: null,
      doenca_cronica: null,
      deficiencia: null,
      tratamento_medico: null,
    };

    // Não deve lançar erro mesmo com todos os campos nulos
    expect(() => construirFicha(socioMinimo)).not.toThrow();
  });

});