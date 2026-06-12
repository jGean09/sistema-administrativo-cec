import { useState, useEffect } from 'react';
import api from '../../services/api';
import './GerenciarNoticias.css'; // Import do novo CSS

const CATEGORIAS = [
  { value: 'aviso', label: 'Aviso Geral', visibilidade: 'publica' },
  { value: 'edital', label: 'Edital', visibilidade: 'publica' },
  { value: 'assembleia', label: 'Assembleia', visibilidade: 'socios' },
  { value: 'portaria', label: 'Portaria', visibilidade: 'socios' },
  { value: 'escala', label: 'Escala de Limpeza', visibilidade: 'socios' },
];

const INITIAL = { titulo: '', conteudo: '', categoria: 'aviso', visibilidade: 'publica' };

// Remove o '/api' da URL base para acessar a pasta pública de imagens no Render
const BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:3001';

export default function GerenciarNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [imagem, setImagem] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = () => {
    api.get('/noticias').then(res => setNoticias(res.data));
  };

  useEffect(() => { carregar(); }, []);

  const handleCategoria = (e) => {
    const cat = CATEGORIAS.find(c => c.value === e.target.value);
    setForm(prev => ({ ...prev, categoria: cat.value, visibilidade: cat.visibilidade }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (imagem) data.append('imagem', imagem);

    try {
      if (editandoId) {
        await api.put(`/noticias/${editandoId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Notícia atualizada!');
      } else {
        await api.post('/noticias', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Notícia publicada!');
      }
      setForm(INITIAL); setImagem(null); setEditandoId(null); setMostrarForm(false);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (n) => {
    setForm({ titulo: n.titulo, conteudo: n.conteudo, categoria: n.categoria, visibilidade: n.visibilidade });
    setEditandoId(n.id);
    setMostrarForm(true);
    window.scrollTo(0, 0);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta notícia?')) return;
    await api.delete(`/noticias/${id}`);
    carregar();
  };

  const corCategoria = { aviso: '#1565c0', edital: '#6a1b9a', assembleia: '#e65100', portaria: '#2e7d32', escala: '#558b2f' };
  const labelCategoria = { aviso: 'Aviso', edital: 'Edital', assembleia: 'Assembleia', portaria: 'Portaria', escala: 'Escala' };

  return (
    <div className="noticias-container">
      <div className="noticias-header">
        <h2 className="noticias-title">Gerenciar Notícias</h2>
        <button
          className="btn-nova-noticia"
          onClick={() => { setMostrarForm(!mostrarForm); setForm(INITIAL); setEditandoId(null); }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nova Notícia'}
        </button>
      </div>

      {/* FORMULÁRIO */}
      {mostrarForm && (
        <div className="form-container">
          <h3 className="form-title">{editandoId ? 'Editar Notícia' : 'Nova Notícia'}</h3>
          <form onSubmit={handleSubmit} className="noticias-form">
            <div>
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required
              />
            </div>
            <div>
              <label className="form-label">Categoria *</label>
              <select
                className="form-input"
                value={form.categoria} onChange={handleCategoria}
              >
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <small className="form-help-text">
                Visibilidade: <strong>{form.visibilidade === 'publica' ? '🌐 Pública (todos veem)' : '🔒 Apenas sócios'}</strong>
              </small>
            </div>
            <div>
              <label className="form-label">Conteúdo *</label>
              <textarea
                className="form-input form-textarea"
                value={form.conteudo} onChange={e => setForm({ ...form, conteudo: e.target.value })} required rows={6}
              />
            </div>
            <div>
              <label className="form-label">Imagem (opcional)</label>
              <input type="file" accept="image/*" onChange={e => setImagem(e.target.files[0])} className="form-file-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Publicar Notícia'}
            </button>
          </form>
        </div>
      )}

      {/* LISTA */}
      <div className="noticias-list">
        {noticias.length === 0 && <p className="empty-text">Nenhuma notícia publicada.</p>}
        {noticias.map(n => (
          <div key={n.id} className="noticia-card">
            {n.imagem_url && (
              <img src={`${BASE_URL}${n.imagem_url}`} alt="" className="noticia-img" />
            )}
            <div className="noticia-content">
              <div className="noticia-badges">
                <span className="badge-base" style={{ background: corCategoria[n.categoria] || '#666', color: '#fff' }}>
                  {labelCategoria[n.categoria] || n.categoria}
                </span>
                <span className={`badge-base ${n.visibilidade === 'publica' ? 'badge-publica' : 'badge-socios'}`}>
                  {n.visibilidade === 'publica' ? '🌐 Pública' : '🔒 Sócios'}
                </span>
              </div>
              <strong className="noticia-titulo">{n.titulo}</strong>
              <p className="noticia-resumo">{n.conteudo.substring(0, 120)}...</p>
              <small className="noticia-meta">Por {n.autor_nome} — {new Date(n.created_at).toLocaleDateString('pt-BR')}</small>
            </div>
            <div className="noticia-actions">
              <button onClick={() => handleEditar(n)} className="btn-edit">
                Editar
              </button>
              <button onClick={() => handleExcluir(n.id)} className="btn-delete">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}