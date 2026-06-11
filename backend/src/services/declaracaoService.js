// ============================================================
// PADRÃO: Service Layer
// SOLID S — Single Responsibility: orquestra a geração
//           da declaração.
// GRASP Expert: sabe buscar o sócio e chamar o builder.
// ============================================================

const pool = require('../config/database');
const { construirDeclaracao } = require('./declaracaoBuilder');

/**
 * Gera a declaração PDF para um sócio pelo ID.
 * Lança erro se o sócio não for encontrado.
 *
 * @param {string|number} id  - ID do sócio na tabela `socios`
 * @returns {PDFDocument}     - Stream do documento pronto para piped
 */
const gerarDeclaracao = async (id) => {
  const result = await pool.query(
    'SELECT * FROM socios WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Sócio não encontrado.');
  }

  const socio = result.rows[0];

  // Delega a montagem do PDF para o declaracaoBuilder
  return construirDeclaracao(socio);
};

module.exports = { gerarDeclaracao };