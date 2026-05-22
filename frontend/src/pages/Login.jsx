import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
//import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const usuario = await login(email, senha);
      // Redireciona conforme perfil
      if (['presidente', 'admin', 'diretoria'].includes(usuario.tipo_usuario)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-sidebar">
          <div className="login-logo">
            <div className="logo-circle">CEC</div>
            <h1>Casa do Estudante de Caicó</h1>
            <p>Sistema Administrativo</p>
          </div>
          <div className="login-info">
            <div className="info-item">
              <span className="info-icon">📋</span>
              <span>Acompanhe editais e notícias</span>
            </div>
            <div className="info-item">
              <span className="info-icon">📊</span>
              <span>Transparência financeira</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🏠</span>
              <span>Escala de limpeza e atas</span>
            </div>
          </div>
        </div>

        <div className="login-form-area">
          <h2>Bem-vindo(a)</h2>
          <p className="login-subtitle">Acesse sua conta de sócio(a)</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••••"
                required
              />
              <span className="field-hint">Primeiro acesso: use seu CPF sem pontos e traço</span>
            </div>

            {erro && <div className="erro-msg">{erro}</div>}

            <button type="submit" className="btn-primary" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Ainda não é sócio?{' '}
              <Link to="/cadastro">Faça seu cadastro</Link>
            </p>
            <p className="hint-cpf">
              Sua senha padrão é o CPF cadastrado (somente números)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
