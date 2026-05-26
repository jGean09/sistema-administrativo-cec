// ============================================================
// PADRÃO: MVC — Controller (Camada de Controle)
// GRASP Controller: recebe a requisição HTTP, chama o serviço
//                  correto e devolve a resposta HTTP.
// SOLID S: este controller tem UMA responsabilidade —
//          coordenar. Ele NÃO contém regras de negócio.
//          Toda lógica está no socioService.js
// ============================================================

const socioService = require('../services/socioService');

// ─── LISTAR ──────────────────────────────────────────────────
// Controller delega para o serviço e trata a resposta HTTP.
const listar = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const resultado = await socioService.listarSocios(req.query);
    res.json(resultado);
  } catch (err) {
    console.error('[listar sócios]', err);
    res.status(500).json({ error: 'Erro ao listar sócios.' });
  }
};

// ─── CADASTRAR ───────────────────────────────────────────────
// O controller não sabe COMO cadastrar — ele só pede
// para o serviço fazer e trata o resultado.
const cadastrar = async (req, res) => {
  try {
    const socio = await socioService.cadastrarSocio(req.body);
    res.status(201).json({
      message: 'Sócio cadastrado com sucesso!',
      socio
    });
  } catch (err) {
    console.error('[cadastrar sócio]', err);
    // Se o erro é de duplicidade (regra de negócio), retorna 409
    if (err.message.includes('já cadastrado')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao cadastrar no banco.' });
  }
};

// ─── BUSCAR POR ID ───────────────────────────────────────────
const buscarPorId = async (req, res) => {
  try {
    const socio = await socioService.buscarSocioPorId(req.params.id);
    res.json(socio);
  } catch (err) {
    console.error('[buscar sócio]', err);
    if (err.message === 'Sócio não encontrado.') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erro ao buscar sócio.' });
  }
};

// ─── ATUALIZAR ───────────────────────────────────────────────
const atualizar = async (req, res) => {
  try {
    await socioService.atualizarSocio(req.params.id, req.body);
    res.json({ message: 'Sócio atualizado com sucesso!' });
  } catch (err) {
    console.error('[atualizar sócio]', err);
    res.status(500).json({ error: 'Erro ao atualizar no banco.' });
  }
};

module.exports = { listar, cadastrar, buscarPorId, atualizar };