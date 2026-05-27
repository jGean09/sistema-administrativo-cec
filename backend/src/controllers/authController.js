// ============================================================
// PADRÃO: MVC — Controller de Autenticação
// SOLID S — Single Responsibility: só coordena as requisições
//           de autenticação. Toda lógica está no authService.
// GRASP Controller: recebe HTTP, chama serviço, responde.
// ============================================================

const authService = require('../services/authService');

// ─── LOGIN ───────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const resultado = await authService.autenticar(email, senha);
    return res.json(resultado);
  } catch (err) {
    console.error('[login]', err);
    // Trata erro de conta suspensa separadamente — status 403
    if (err.message === 'SUSPENSO') {
      return res.status(403).json({
        error: 'Conta suspensa. Entre em contato com a diretoria da CEC.'
      });
    }
    // Erros de credencial retornam 401
    if (err.message === 'E-mail ou senha incorretos.') {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// ─── PERFIL ──────────────────────────────────────────────────
const perfil = async (req, res) => {
  try {
    const dados = await authService.buscarPerfil(req.usuario.id);
    return res.json(dados);
  } catch (err) {
    console.error('[perfil]', err);
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
};

// ─── TROCAR SENHA ────────────────────────────────────────────
const trocarSenha = async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    await authService.trocarSenha(req.usuario.id, senhaAtual, novaSenha);
    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error('[trocar senha]', err);
    if (err.message === 'Senha atual incorreta.') {
      return res.status(401).json({ error: err.message });
    }
    if (err.message.includes('6 caracteres')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};

module.exports = { login, perfil, trocarSenha };