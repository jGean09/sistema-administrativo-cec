import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
    <label style={{ fontSize: '13px', color: '#555', marginBottom: '4px', display: 'block' }}>{txt}</label>
  );

  const info = (txt) => (
    <div style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '14px', color: '#333' }}>
      {txt || '—'}
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <h2 style={{ marginBottom: '4px' }}>Meu Perfil</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>Matrícula: <strong>{usuario?.matricula}</strong></p>

      {/* DADOS PESSOAIS */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1b3d2f' }}>Dados Pessoais</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
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
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1b3d2f' }}>Alterar Senha</h3>
        <form onSubmit={handleSenha} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            {label('Senha Atual')}
            <input
              type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
              required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            {label('Nova Senha')}
            <input
              type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            {label('Confirmar Nova Senha')}
            <input
              type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
              required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ padding: '10px', background: '#1b3d2f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            {loading ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}