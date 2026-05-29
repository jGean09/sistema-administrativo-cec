// ============================================================
// TESTES — authService.js
// O que testamos: autenticação, perfil e troca de senha
// Strategy: verificamos se as permissões por cargo funcionam
// ============================================================

jest.mock('../config/database', () => ({
  query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hash_falso'),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token_falso_para_teste')
}));

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// TESTES: Strategy — obterPermissoes
// ============================================================
describe('obterPermissoes (Strategy)', () => {

  test('presidente deve ter acesso total', () => {
    const permissoes = authService.obterPermissoes('presidente');
    expect(permissoes.podeGerenciarSocios).toBe(true);
    expect(permissoes.podeCadastrarSocio).toBe(true);
    expect(permissoes.podePublicarNoticias).toBe(true);
    expect(permissoes.podeVerRelatorios).toBe(true);
    expect(permissoes.podeVerDashboard).toBe(true);
  });

  test('secretario deve poder cadastrar sócios mas não ver relatórios', () => {
    const permissoes = authService.obterPermissoes('secretario');
    expect(permissoes.podeCadastrarSocio).toBe(true);
    expect(permissoes.podePublicarNoticias).toBe(true);
    expect(permissoes.podeVerRelatorios).toBe(false);
  });

  test('diretoria não deve poder cadastrar sócios', () => {
    const permissoes = authService.obterPermissoes('diretoria');
    expect(permissoes.podeCadastrarSocio).toBe(false);
    expect(permissoes.podeGerenciarSocios).toBe(true);
  });

  test('socio deve ter apenas acesso básico', () => {
    const permissoes = authService.obterPermissoes('socio');
    expect(permissoes.podeGerenciarSocios).toBe(false);
    expect(permissoes.podeCadastrarSocio).toBe(false);
    expect(permissoes.podePublicarNoticias).toBe(false);
    expect(permissoes.podeVerRelatorios).toBe(false);
    expect(permissoes.podeVerDashboard).toBe(false);
  });

  test('cargo desconhecido deve receber permissões mínimas de sócio', () => {
    const permissoes = authService.obterPermissoes('cargo_inexistente');
    expect(permissoes.podeGerenciarSocios).toBe(false);
    expect(permissoes.podeCadastrarSocio).toBe(false);
  });

});

// ============================================================
// TESTES: autenticar
// ============================================================
describe('autenticar', () => {

  const socioFalso = {
    id: 1,
    nome: 'José Gean',
    email: 'gean@cec.org.br',
    cpf: '706.337.724-06',
    senha_hash: 'hash_do_banco',
    tipo_usuario: 'presidente',
    cargo: 'Presidente Geral',
    departamento: 'masculino',
    status_socio: 'ativo',
    matricula: '20260001-11'
  };

  test('deve autenticar com sucesso e retornar token e permissões', async () => {
    pool.query.mockResolvedValueOnce({ rows: [socioFalso] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const resultado = await authService.autenticar('gean@cec.org.br', 'senha123');

    expect(resultado.token).toBe('token_falso_para_teste');
    expect(resultado.usuario.nome).toBe('José Gean');
    expect(resultado.usuario.tipo_usuario).toBe('presidente');
    // Strategy: presidente deve ter todas as permissões
    expect(resultado.permissoes.podeGerenciarSocios).toBe(true);
    expect(resultado.permissoes.podeVerRelatorios).toBe(true);
  });

  test('deve lançar erro quando e-mail não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(authService.autenticar('naoexiste@email.com', 'senha123'))
      .rejects
      .toThrow('E-mail ou senha incorretos.');
  });

  test('deve lançar erro SUSPENSO quando conta está suspensa', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ ...socioFalso, status_socio: 'suspenso' }]
    });

    await expect(authService.autenticar('gean@cec.org.br', 'senha123'))
      .rejects
      .toThrow('SUSPENSO');
  });

  test('deve lançar erro quando senha está incorreta', async () => {
    pool.query.mockResolvedValueOnce({ rows: [socioFalso] });
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.autenticar('gean@cec.org.br', 'senha_errada'))
      .rejects
      .toThrow('E-mail ou senha incorretos.');
  });

  test('não deve retornar senha_hash na resposta', async () => {
    pool.query.mockResolvedValueOnce({ rows: [socioFalso] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const resultado = await authService.autenticar('gean@cec.org.br', 'senha123');

    expect(resultado.usuario.senha_hash).toBeUndefined();
  });

});

// ============================================================
// TESTES: buscarPerfil
// ============================================================
describe('buscarPerfil', () => {

  test('deve retornar perfil completo com permissões', async () => {
    const perfilFalso = {
      id: 1,
      nome: 'José Gean',
      email: 'gean@cec.org.br',
      tipo_usuario: 'secretario'
    };
    pool.query.mockResolvedValueOnce({ rows: [perfilFalso] });

    const resultado = await authService.buscarPerfil(1);

    expect(resultado.nome).toBe('José Gean');
    // Permissões da Strategy incluídas no perfil
    expect(resultado.permissoes).toBeDefined();
    expect(resultado.permissoes.podeCadastrarSocio).toBe(true);
  });

  test('deve lançar erro quando usuário não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(authService.buscarPerfil(999))
      .rejects
      .toThrow('Usuário não encontrado.');
  });

});

// ============================================================
// TESTES: trocarSenha
// ============================================================
describe('trocarSenha', () => {

  test('deve trocar senha com sucesso', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ senha_hash: 'hash_atual' }] });
    bcrypt.compare.mockResolvedValueOnce(true);
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      authService.trocarSenha(1, 'senha_atual', 'nova_senha_123')
    ).resolves.not.toThrow();

    expect(bcrypt.hash).toHaveBeenCalledWith('nova_senha_123', 10);
  });

  test('deve lançar erro quando senha atual está incorreta', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ senha_hash: 'hash_atual' }] });
    bcrypt.compare.mockResolvedValueOnce(false);

    await expect(authService.trocarSenha(1, 'senha_errada', 'nova_senha'))
      .rejects
      .toThrow('Senha atual incorreta.');
  });

  test('deve lançar erro quando nova senha tem menos de 6 caracteres', async () => {
    await expect(authService.trocarSenha(1, 'senha_atual', '123'))
      .rejects
      .toThrow('A nova senha deve ter ao menos 6 caracteres.');
  });

});