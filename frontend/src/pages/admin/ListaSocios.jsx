import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ListaSocios() {
  const [socios, setSocios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroDep, setFiltroDep] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome_asc');

  useEffect(() => {
    api.get('/socios?limite=200')
      .then(res => {
        const data = res.data.socios || res.data;
        setSocios(Array.isArray(data) ? data : []);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Aplicar filtros e ordenação no frontend
  const sociosFiltrados = socios
    .filter(s => {
      const matchBusca = !busca || s.nome.toLowerCase().includes(busca.toLowerCase());
      const matchDep = !filtroDep || s.departamento === filtroDep;
      const matchStatus = !filtroStatus || s.status_socio === filtroStatus;
      return matchBusca && matchDep && matchStatus;
    })
    .sort((a, b) => {
      switch (ordenacao) {
        case 'nome_asc':  return a.nome.localeCompare(b.nome);
        case 'nome_desc': return b.nome.localeCompare(a.nome);
        case 'idade_asc':
          return new Date(a.data_nascimento || 0) - new Date(b.data_nascimento || 0);
        case 'idade_desc':
          return new Date(b.data_nascimento || 0) - new Date(a.data_nascimento || 0);
        case 'matricula':
          return (a.matricula || '').localeCompare(b.matricula || '');
        default: return 0;
      }
    });

  const calcIdade = (dataNasc) => {
    if (!dataNasc) return '—';
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  // Contadores para badges
  const totalMasc = socios.filter(s => s.departamento === 'masculino').length;
  const totalFem  = socios.filter(s => s.departamento === 'feminino').length;
  const totalAtivo = socios.filter(s => s.status_socio === 'ativo').length;

  return (
    <div style={{ padding: '20px' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Gestão de Sócios</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
            {sociosFiltrados.length} de {socios.length} sócios exibidos
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/cadastrar-socio')}
          style={{ padding: '10px 20px', background: '#1b3d2f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Novo Sócio
        </button>
      </div>

      {/* BADGES DE RESUMO */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', valor: socios.length, cor: '#1b3d2f' },
          { label: 'Ativos', valor: totalAtivo, cor: '#2e7d32' },
          { label: 'Masculino', valor: totalMasc, cor: '#1565c0' },
          { label: 'Feminino', valor: totalFem, cor: '#ad1457' },
        ].map(b => (
          <div key={b.label} style={{
            background: b.cor, color: '#fff', borderRadius: '8px',
            padding: '8px 16px', fontSize: '13px', fontWeight: 'bold'
          }}>
            {b.label}: {b.valor}
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '16px',
        background: '#f8f9f8', padding: '14px', borderRadius: '10px',
        flexWrap: 'wrap'
      }}>
        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: '1', minWidth: '180px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        />
        <select
          value={filtroDep}
          onChange={e => setFiltroDep(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        >
          <option value="">Todos os dep.</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
        </select>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="suspenso">Suspenso</option>
        </select>
        <select
          value={ordenacao}
          onChange={e => setOrdenacao(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
        >
          <option value="nome_asc">Nome A→Z</option>
          <option value="nome_desc">Nome Z→A</option>
          <option value="idade_asc">Mais velho primeiro</option>
          <option value="idade_desc">Mais novo primeiro</option>
          <option value="matricula">Matrícula</option>
        </select>
        {(busca || filtroDep || filtroStatus || ordenacao !== 'nome_asc') && (
          <button
            onClick={() => { setBusca(''); setFiltroDep(''); setFiltroStatus(''); setOrdenacao('nome_asc'); }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#666' }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* TABELA */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9f8' }}>
            <tr style={{ textAlign: 'left', fontSize: '13px', color: '#666' }}>
              <th style={{ padding: '14px 15px' }}>Nome</th>
              <th style={{ padding: '14px 15px' }}>Departamento</th>
              <th style={{ padding: '14px 15px' }}>Idade</th>
              <th style={{ padding: '14px 15px' }}>Status</th>
              <th style={{ padding: '14px 15px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>Carregando...</td></tr>
            ) : sociosFiltrados.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>Nenhum sócio encontrado.</td></tr>
            ) : sociosFiltrados.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '14px 15px', fontWeight: '500' }}>{s.nome}</td>
                <td style={{ padding: '14px 15px', textTransform: 'capitalize' }}>{s.departamento}</td>
                <td style={{ padding: '14px 15px', color: '#666' }}>{calcIdade(s.data_nascimento)} anos</td>
                <td style={{ padding: '14px 15px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                    background: s.status_socio === 'ativo' ? '#e8f5e9' : s.status_socio === 'suspenso' ? '#fff3e0' : '#ffebee',
                    color: s.status_socio === 'ativo' ? '#2e7d32' : s.status_socio === 'suspenso' ? '#e65100' : '#c62828'
                  }}>
                    {s.status_socio}
                  </span>
                </td>
                <td style={{ padding: '14px 15px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => navigate(`/admin/socios/editar/${s.id}`)}
                    style={{ border: 'none', background: 'none', color: '#1b3d2f', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}/socios/${s.id}/ficha`, '_blank')}
                    style={{ border: 'none', background: 'none', color: '#8B0000', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                  >
                    Ficha PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}