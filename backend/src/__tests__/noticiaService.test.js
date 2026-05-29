// ============================================================
// TESTES — noticiaService.js
// O que testamos: listagem, publicação, edição e exclusão
// de notícias com as regras de negócio corretas.
// ============================================================

jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../config/database');
const noticiaService = require('../services/noticiaService');

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// TESTES: listarPublicas
// ============================================================
describe('listarPublicas', () => {

  test('deve retornar apenas notícias públicas', async () => {
    const noticiasFalsas = [
      { id: 1, titulo: 'Edital 01/2026', categoria: 'edital', visibilidade: 'publica' },
      { id: 2, titulo: 'Aviso Geral', categoria: 'aviso', visibilidade: 'publica' },
    ];
    pool.query.mockResolvedValueOnce({ rows: noticiasFalsas });

    const resultado = await noticiaService.listarPublicas();

    expect(resultado).toHaveLength(2);
    // Verifica que a query filtra por visibilidade publica
    const queryExecutada = pool.query.mock.calls[0][0];
    expect(queryExecutada).toContain("visibilidade = 'publica'");
  });

  test('deve filtrar por categoria quando informado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [
      { id: 1, titulo: 'Edital 01/2026', categoria: 'edital' }
    ]});

    const resultado = await noticiaService.listarPublicas({ categoria: 'edital' });

    expect(resultado[0].categoria).toBe('edital');
    expect(pool.query).toHaveBeenCalled();
  });

  test('deve retornar lista vazia quando não há notícias públicas', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await noticiaService.listarPublicas();

    expect(resultado).toHaveLength(0);
  });

});

// ============================================================
// TESTES: listar (para sócios)
// ============================================================
describe('listar', () => {

  test('deve retornar notícias públicas e exclusivas de sócios', async () => {
    const noticiasFalsas = [
      { id: 1, titulo: 'Edital', visibilidade: 'publica' },
      { id: 2, titulo: 'Assembleia', visibilidade: 'socios' },
    ];
    pool.query.mockResolvedValueOnce({ rows: noticiasFalsas });

    const resultado = await noticiaService.listar();

    expect(resultado).toHaveLength(2);
    // Verifica que a query inclui ambas as visibilidades
    const queryExecutada = pool.query.mock.calls[0][0];
    expect(queryExecutada).toContain("visibilidade = 'publica'");
    expect(queryExecutada).toContain("visibilidade = 'socios'");
  });

});

// ============================================================
// TESTES: publicarNoticia
// ============================================================
describe('publicarNoticia', () => {

  test('deve publicar notícia com sucesso', async () => {
    const noticiaFalsa = {
      id: 1,
      titulo: 'Edital 01/2026',
      conteudo: 'Conteúdo do edital',
      categoria: 'edital',
      visibilidade: 'publica',
      autor_nome: 'José Gean'
    };
    pool.query.mockResolvedValueOnce({ rows: [noticiaFalsa] });

    const resultado = await noticiaService.publicarNoticia({
      titulo: 'Edital 01/2026',
      conteudo: 'Conteúdo do edital',
      categoria: 'edital',
      visibilidade: 'publica',
      imagem_url: null,
      autor_id: 1,
      autor_nome: 'José Gean'
    });

    expect(resultado.titulo).toBe('Edital 01/2026');
    expect(resultado.autor_nome).toBe('José Gean');
  });

  test('deve usar categoria aviso como padrão', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, categoria: 'aviso' }] });

    await noticiaService.publicarNoticia({
      titulo: 'Teste',
      conteudo: 'Conteúdo',
      autor_id: 1,
      autor_nome: 'José'
    });

    // Verifica que 'aviso' foi passado como padrão
    const params = pool.query.mock.calls[0][1];
    expect(params).toContain('aviso');
  });

  test('deve usar visibilidade publica como padrão', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await noticiaService.publicarNoticia({
      titulo: 'Teste',
      conteudo: 'Conteúdo',
      autor_id: 1,
      autor_nome: 'José'
    });

    const params = pool.query.mock.calls[0][1];
    expect(params).toContain('publica');
  });

  test('deve lançar erro quando título está ausente', async () => {
    await expect(noticiaService.publicarNoticia({
      titulo: '',
      conteudo: 'Conteúdo',
      autor_id: 1,
      autor_nome: 'José'
    })).rejects.toThrow('Título e conteúdo são obrigatórios.');
  });

  test('deve lançar erro quando conteúdo está ausente', async () => {
    await expect(noticiaService.publicarNoticia({
      titulo: 'Título',
      conteudo: '',
      autor_id: 1,
      autor_nome: 'José'
    })).rejects.toThrow('Título e conteúdo são obrigatórios.');
  });

});

// ============================================================
// TESTES: editarNoticia
// ============================================================
describe('editarNoticia', () => {

  test('deve editar notícia com sucesso', async () => {
    // Primeira query: busca notícia atual
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, titulo: 'Título antigo', imagem_url: '/uploads/foto.jpg' }]
    });
    // Segunda query: UPDATE
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(noticiaService.editarNoticia(1, {
      titulo: 'Título novo',
      conteudo: 'Conteúdo novo',
      categoria: 'aviso',
      visibilidade: 'publica',
      imagem_url: null
    })).resolves.not.toThrow();
  });

  test('deve manter imagem anterior quando não enviar nova', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, imagem_url: '/uploads/imagem_antiga.jpg' }]
    });
    pool.query.mockResolvedValueOnce({ rows: [] });

    await noticiaService.editarNoticia(1, {
      titulo: 'Título',
      conteudo: 'Conteúdo',
      categoria: 'aviso',
      visibilidade: 'publica',
      imagem_url: null // não enviou nova imagem
    });

    // Verifica que a imagem antiga foi mantida no UPDATE
    const params = pool.query.mock.calls[1][1];
    expect(params).toContain('/uploads/imagem_antiga.jpg');
  });

  test('deve lançar erro quando notícia não existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(noticiaService.editarNoticia(999, {
      titulo: 'Título',
      conteudo: 'Conteúdo',
      categoria: 'aviso',
      visibilidade: 'publica'
    })).rejects.toThrow('Notícia não encontrada.');
  });

});

// ============================================================
// TESTES: excluirNoticia
// ============================================================
describe('excluirNoticia', () => {

  test('deve excluir notícia sem erros', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(noticiaService.excluirNoticia(1))
      .resolves.not.toThrow();

    expect(pool.query).toHaveBeenCalledWith(
      'DELETE FROM noticias WHERE id = $1',
      [1]
    );
  });

});