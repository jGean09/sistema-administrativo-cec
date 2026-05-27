// ============================================================
// PADRÃO: Service Layer — Serviço de Ficha
// SOLID S — Single Responsibility: este arquivo tem UMA
//           responsabilidade — orquestrar a geração da ficha.
// GRASP Expert: sabe buscar o sócio e chamar o builder.
// GRASP Controller: coordena fichaBuilder e o banco.
// ============================================================

const pool = require('../config/database');
const { construirFicha } = require('./fichaBuilder');

// ─── GERAR FICHA DO SÓCIO ────────────────────────────────────
// Regra de negócio:
// 1. Busca o sócio pelo ID no banco
// 2. Lança erro se não encontrar
// 3. Delega a construção do PDF para o fichaBuilder
// 4. Retorna o documento pronto para o controller enviar
const gerarFicha = async (id) => {
  const result = await pool.query(
    'SELECT * FROM socios WHERE id = $1',
    [id]
  );

  // Regra de negócio: sócio precisa existir para gerar ficha
  if (result.rows.length === 0) {
    throw new Error('Sócio não encontrado.');
  }

  const socio = result.rows[0];

  // Delega a montagem do PDF para o fichaBuilder
  // O service não sabe COMO montar — só sabe QUE deve montar
  return construirFicha(socio);
};

module.exports = { gerarFicha };