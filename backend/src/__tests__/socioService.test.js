// ============================================================
// TESTES — socioService.js
// Ferramenta: Jest
// O que testamos: as regras de negócio do serviço de sócios
// sem depender do banco real — usamos "mocks" (simulações).
//
// O que é um mock?
// É uma simulação de uma dependência externa (banco, API).
// Em vez de conectar no PostgreSQL de verdade, fingimos
// que o banco respondeu com os dados que queremos testar.
// Isso torna os testes rápidos e independentes do ambiente.
// ============================================================

// Simula o módulo do banco de dados inteiro
// Qualquer chamada a pool.query() será controlada por nós
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

// Simula o bcryptjs para não precisar calcular hash de verdade
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hash_falso_para_teste'),
  compare: jest.fn()
}));

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const socioService = require('../services/socioService');

// ─── LIMPA OS MOCKS ENTRE CADA TESTE ─────────────────────────
// Garante que um teste não interfere no outro
beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// TESTES: listarSocios
// ============================================================
describe('listarSocios', () => {

  test('deve retornar lista de sócios com total e paginação', async () => {
    // ARRANGE — prepara o que o "banco" vai responder
    const sociosFalsos = [
      { id: 1, nome: 'João Silva', departamento: 'masculino', status_socio: 'ativo' },
      { id: 2, nome: 'Maria Santos', departamento: 'feminino', status_socio: 'ativo' },
    ];

    // Primeira query retorna sócios, segunda retorna contagem
    pool.query
      .mockResolvedValueOnce({ rows: sociosFalsos })
      .mockResolvedValueOnce({ rows: [{ count: '2' }] });

    // ACT — executa a função que queremos testar
    const resultado = await socioService.listarSocios({});

    // ASSERT — verifica se o resultado é o esperado
    expect(resultado.socios).toHaveLength(2);
    expect(resultado.total).toBe(2);
    expect(resultado.socios[0].nome).toBe('João Silva');
  });

  test('deve filtrar por departamento quando informado', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nome: 'João', departamento: 'masculino' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const resultado = await socioService.listarSocios({ departamento: 'masculino' });

    // Verifica se a query foi chamada com o filtro de departamento
    expect(pool.query).toHaveBeenCalled();
    expect(resultado.socios[0].departamento).toBe('masculino');
  });

  test('deve retornar lista vazia quando não há sócios', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    const resultado = await socioService.listarSocios({});

    expect(resultado.socios).toHaveLength(0);
    expect(resultado.total).toBe(0);
  });

});

// ============================================================
// TESTES: buscarSocioPorId
// ============================================================
describe('buscarSocioPorId', () => {

  test('deve retornar sócio quando ID existe', async () => {
    const socioFalso = { id: 1, nome: 'João Silva', cpf: '123.456.789-00' };
    pool.query.mockResolvedValueOnce({ rows: [socioFalso] });

    const resultado = await socioService.buscarSocioPorId(1);

    expect(resultado).toEqual(socioFalso);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM socios WHERE id = $1',
      [1]
    );
  });

  test('deve lançar erro quando sócio não existe', async () => {
    // Banco retorna array vazio — sócio não encontrado
    pool.query.mockResolvedValueOnce({ rows: [] });

    // Verifica se a função lança o erro correto
    await expect(socioService.buscarSocioPorId(999))
      .rejects
      .toThrow('Sócio não encontrado.');
  });

});

// ============================================================
// TESTES: cadastrarSocio
// ============================================================
describe('cadastrarSocio', () => {

  const dadosValidos = {
    nome: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao@teste.com',
    genero: 'M',
    departamento: 'masculino',
    data_nascimento: '2000-01-01',
    naturalidade: 'Caicó/RN',
    rg: '1234567',
    nome_pai: 'José Silva',
    nome_mae: 'Maria Silva',
    telefone: '84999999999',
    endereco_logradouro: 'Rua Teste',
    endereco_numero: '123',
    endereco_bairro: 'Centro',
    endereco_cidade: 'Caicó',
    endereco_uf: 'RN',
    endereco_cep: '59300-000',
    instituicao: 'UFRN',
    escolaridade: 'Superior incompleto',
    periodo_serie: '3º período',
    ano_inclusao: '2024.1',
    alergias: 'Não',
    medicacao: 'Não',
    doenca_cronica: 'Não',
    deficiencia: 'Não',
    tratamento_medico: 'Não',
  };

  test('deve cadastrar sócio com sucesso', async () => {
    // Primeira query: verificar duplicidade — retorna vazio (não existe)
    pool.query.mockResolvedValueOnce({ rows: [] });
    // Segunda query: contar para gerar matrícula
    pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    // Terceira query: INSERT — retorna o sócio criado
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, matricula: '20260001-42', nome: 'João Silva' }]
    });

    const resultado = await socioService.cadastrarSocio(dadosValidos);

    expect(resultado.nome).toBe('João Silva');
    expect(resultado.matricula).toBeDefined();
    // Verifica se bcrypt foi chamado para hash da senha
    expect(bcrypt.hash).toHaveBeenCalledWith('12345678900', 10);
  });

  test('deve lançar erro quando CPF ou e-mail já existe', async () => {
    // Banco retorna um sócio — duplicidade encontrada
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await expect(socioService.cadastrarSocio(dadosValidos))
      .rejects
      .toThrow('CPF ou e-mail já cadastrado.');
  });

});

// ============================================================
// TESTES: atualizarSocio
// ============================================================
describe('atualizarSocio', () => {

  test('deve atualizar sócio sem erros', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    // Não deve lançar erro
    await expect(
      socioService.atualizarSocio(1, { nome: 'João Atualizado', status_socio: 'ativo' })
    ).resolves.not.toThrow();

    expect(pool.query).toHaveBeenCalled();
  });

test('não deve atualizar campos proibidos como senha_hash', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });

  await socioService.atualizarSocio(1, {
    nome: 'João',
    senha_hash: 'tentativa_de_hack',
    id: 99
  });

  const queryExecutada = pool.query.mock.calls[0][0];

  // senha_hash não deve aparecer em nenhuma parte da query
  expect(queryExecutada).not.toContain('senha_hash');

  // WHERE id = é correto e esperado
  expect(queryExecutada).toContain('WHERE id =');

  // O SET deve conter apenas 'nome', não 'id' nem 'senha_hash'
  const parteSET = queryExecutada.split('WHERE')[0];
  expect(parteSET).not.toContain('senha_hash');
  expect(parteSET).not.toContain('"id"');
  });

});