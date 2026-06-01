import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
      await login(email, senha);
      navigate('/dashboard'); // Ajuste para a rota correta do seu painel logado
    } catch (err) {
      setErro(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-split-card">
        
        {/* Lado Esquerdo - Verde Institucional */}
        <div className="login-left">
          <div className="login-left-content">
            <div className="logo-circle">CEC</div>
            <h2 className="inst-title">Casa do Estudante de Caicó</h2>
            <p className="inst-subtitle">Sistema Administrativo</p>
            
            <ul className="features-list">
              <li>
                <span className="feature-icon">📋</span>
                Acompanhe editais e notícias
              </li>
              <li>
                <span className="feature-icon">📊</span>
                Transparência financeira
              </li>
              <li>
                <span className="feature-icon">🏠</span>
                Escala de limpeza e atas
              </li>
            </ul>
          </div>
        </div>

        {/* Lado Direito - Formulário Branco */}
        <div className="login-right">
          <div className="login-right-header">
            <h2>Bem-vindo(a)</h2>
            <p>Acesse sua conta de sócio(a)</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••••"
                required
              />
              <span className="hint-text">Primeiro acesso: use seu CPF sem pontos e traço</span>
            </div>

            {erro && <div className="error-message">{erro}</div>}

            <button type="submit" className="btn-entrar" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="login-right-footer">
            <p>Ainda não é sócio? <Link to="/cadastro" className="link-cadastro">Faça seu cadastro</Link></p>
            <p className="hint-text-footer">Sua senha padrão é o CPF cadastrado (somente números)</p>
          </div>
        </div>

      </div>
    </div>
  );
}