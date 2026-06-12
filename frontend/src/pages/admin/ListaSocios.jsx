import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CadastroInterno.css'; // Importando o CSS com as novas classes

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
    <div className="lista-container">

      {/* CABEÇALHO */}
      <div className="lista-header">
        <div>
          <h2 className="lista-title">Gestão de Sócios</h2>
          <p className="lista-subtitle">
            {sociosFiltrados.length} de {socios.length} sócios exibidos
          </p>
        </div>
        <button
          className="btn-novo-socio"
          onClick={() => navigate('/admin/cadastrar-socio')}
        >
          + Novo Sócio
        </button>
      </div>

      {/* BADGES DE RESUMO */}
      <div className="badges-container">
        {[
          { label: 'Total', valor: socios.length, cor: '#1b3d2f' },
          { label: 'Ativos', valor: totalAtivo, cor: '#2e7d32' },
          { label: 'Masculino', valor: totalMasc, cor: '#1565c0' },
          { label: 'Feminino', valor: totalFem, cor: '#ad1457' },
        ].map(b => (
          <div key={b.label} className="admin-badge" style={{ backgroundColor: b.cor }}>
            {b.label}: {b.valor}
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="filtros-container">
        <input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="filtro-input"
        />
        <select
          value={filtroDep}
          onChange={e => setFiltroDep(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos os dep.</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
        </select>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="suspenso">Suspenso</option>
        </select>
        <select
          value={ordenacao}
          onChange={e => setOrdenacao(e.target.value)}
          className="filtro-select"
        >
          <option value="nome_asc">Nome A→Z</option>
          <option value="nome_desc">Nome Z→A</option>
          <option value="idade_asc">Mais velho primeiro</option>
          <option value="idade_desc">Mais novo primeiro</option>
          <option value="matricula">Matrícula</option>
        </select>
        {(busca || filtroDep || filtroStatus || ordenacao !== 'nome_asc') && (
          <button
            className="btn-limpar-filtros"
            onClick={() => { setBusca(''); setFiltroDep(''); setFiltroStatus(''); setOrdenacao('nome_asc'); }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* TABELA */}
      <div className="tabela-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Departamento</th>
              <th>Idade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan="5" className="td-empty">Carregando...</td></tr>
            ) : sociosFiltrados.length === 0 ? (
              <tr><td colSpan="5" className="td-empty">Nenhum sócio encontrado.</td></tr>
            ) : sociosFiltrados.map(s => (
              <tr key={s.id}>
                <td className="td-nome">{s.nome}</td>
                <td className="td-dep">{s.departamento}</td>
                <td className="td-idade">{calcIdade(s.data_nascimento)} anos</td>
                <td>
                  <span className={`status-badge status-${s.status_socio}`}>
                    {s.status_socio}
                  </span>
                </td>
                <td className="td-acoes">
                  <button
                    className="btn-acao-editar"
                    onClick={() => navigate(`/admin/socios/editar/${s.id}`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-acao-pdf"
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}/socios/${s.id}/ficha`, '_blank')}
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