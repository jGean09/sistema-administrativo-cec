// ============================================================
// PADRÃO: MVC — Controller de Declaração PDF
// SOLID S — Single Responsibility: só configura os headers
//           HTTP e delega a geração para o declaracaoService.
// GRASP Controller: recebe a requisição, chama o serviço
//           e envia o PDF como resposta.
// ============================================================

const declaracaoService = require('../services/declaracaoService');

const gerarDeclaracao = async (req, res) => {
  const { id } = req.params;

  try {
    // Configura os headers para o browser abrir como PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="declaracao_${id}.pdf"`);

    // Gera o PDF via service e passa o res como destino do stream
    const doc = await declaracaoService.gerarDeclaracao(id);

    // Conecta o stream do PDF diretamente à resposta HTTP
    doc.pipe(res);

  } catch (err) {
    console.error('[gerar declaracao]', err);
    if (err.message === 'Sócio não encontrado.') {
      return res.status(404).json({ error: err.message });
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar declaração.' });
    }
  }
};

module.exports = { gerarDeclaracao };