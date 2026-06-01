// ============================================================
// PADRÃO: MVC — Controller de E-mail
// SOLID S: só coordena — toda lógica está no emailService.
// GRASP Controller: recebe HTTP, chama serviço, responde.
// ============================================================

const emailService = require('../services/emailService');
const upload = require('../config/upload');

// ─── LISTAR SÓCIOS PARA SELEÇÃO ──────────────────────────────
// Retorna lista de sócios com email válido para o frontend
// montar a tela de seleção de destinatários.
const listarDestinatarios = async (req, res) => {
  try {
    const socios = await emailService.listarSociosParaSelecao();
    res.json(socios);
  } catch (err) {
    console.error('[listar destinatários]', err);
    res.status(500).json({ error: 'Erro ao buscar destinatários.' });
  }
};

// ─── ENVIAR E-MAIL ───────────────────────────────────────────
// Usa multer para processar até 5 arquivos anexos antes
// de chamar o service. O multer salva os arquivos temporariamente
// em /uploads e o emailService os remove após o envio.
const enviar = (req, res) => {
  upload.array('anexos', 5)(req, res, async (err) => {

    // Trata erros do multer (arquivo muito grande, tipo inválido)
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { tipo, ids, departamento, status, assunto, mensagem } = req.body;
    const remetente_nome = req.usuario.nome;

    // req.files contém os arquivos enviados pelo multer
    // Se nenhum arquivo foi enviado, usa array vazio
    const anexos = req.files || [];

    // ids vem como string JSON do FormData — precisa parsear
    let idsParsed = [];
    try {
      idsParsed = ids ? JSON.parse(ids) : [];
    } catch (e) {
      idsParsed = [];
    }

    try {
      const resultado = await emailService.processarEnvio({
        tipo,
        ids: idsParsed,
        departamento,
        status,
        assunto,
        mensagem,
        remetente_nome,
        anexos
      });

      res.json({
        message: `E-mail enviado para ${resultado.enviados} sócio(s).`,
        ...resultado
      });
    } catch (err) {
      console.error('[enviar email]', err);
      if (
        err.message.includes('obrigatório') ||
        err.message.includes('Informe') ||
        err.message.includes('Selecione') ||
        err.message.includes('Nenhum')
      ) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
  });
};

module.exports = { listarDestinatarios, enviar };