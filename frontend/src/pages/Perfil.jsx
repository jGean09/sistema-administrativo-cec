import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Perfil.css';

export default function Perfil() {
  const { usuario } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSenha = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmar) return alert('As senhas não coincidem.');
    if (novaSenha.length < 6) return alert('A nova senha precisa ter pelo menos 6 caracteres.');
    setLoading(true);
    try {
      await api.put('/auth/senha', { senhaAtual, novaSenha });
      alert('Senha alterada com sucesso!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const label = (txt) => (
    <label className="perfil-label">{txt}</label>
  );

  const info = (txt) => (
    <div className="perfil-info-box">
      {txt || '—'}
    </div>
  );

  return (
    <div className="perfil-container">
      <h2 className="perfil-title">Meu Perfil</h2>
      <p className="perfil-subtitle">Matrícula: <strong>{usuario?.matricula}</strong></p>

      {/* DADOS PESSOAIS */}
      <div className="perfil-card">
        <h3>Dados Pessoais</h3>
        <div className="perfil-grid">
          <div className="perfil-grid-full">
            {label('Nome Completo')}
            {info(usuario?.nome)}
          </div>
          <div>
            {label('E-mail')}
            {info(usuario?.email)}
          </div>
          <div>
            {label('Telefone')}
            {info(usuario?.telefone)}
          </div>
          <div>
            {label('CPF')}
            {info(usuario?.cpf)}
          </div>
          <div>
            {label('Departamento')}
            {info(usuario?.departamento === 'feminino' ? 'Dep. Feminino' : 'Sede Própria (Masculino)')}
          </div>
          <div>
            {label('Cargo na CEC')}
            {info(usuario?.cargo)}
          </div>
          <div>
            {label('Status')}
            {info(usuario?.status_socio)}
          </div>
        </div>
      </div>

      {/* ALTERAR SENHA */}
      <div className="perfil-card">
        <h3>Alterar Senha</h3>
        <form onSubmit={handleSenha} className="perfil-form">
          <div>
            {label('Senha Atual')}
            <input
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              required
              className="perfil-input"
            />
          </div>
          <div>
            {label('Nova Senha')}
            <input
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              className="perfil-input"
            />
          </div>
          <div>
            {label('Confirmar Nova Senha')}
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              className="perfil-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-salvar">
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}