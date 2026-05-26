import { useState, useEffect } from 'react';
import api from '../../services/api';

const CATEGORIAS = [
  { value: 'aviso', label: 'Aviso Geral', visibilidade: 'publica' },
  { value: 'edital', label: 'Edital', visibilidade: 'publica' },
  { value: 'assembleia', label: 'Assembleia', visibilidade: 'socios' },
  { value: 'portaria', label: 'Portaria', visibilidade: 'socios' },
  { value: 'escala', label: 'Escala de Limpeza', visibilidade: 'socios' },
];

const INITIAL = { titulo: '', conteudo: '', categoria: 'aviso', visibilidade: 'publica' };

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
    <div style={{ padding: '20px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Gerenciar Notícias</h2>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setForm(INITIAL); setEditandoId(null); }}
          style={{ padding: '10px 20px', background: '#1b3d2f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nova Notícia'}
        </button>
      </div>

      {/* FORMULÁRIO */}
      {mostrarForm && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0 }}>{editandoId ? 'Editar Notícia' : 'Nova Notícia'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#555' }}>Título *</label>
              <input
                value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#555' }}>Categoria *</label>
              <select
                value={form.categoria} onChange={handleCategoria}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', marginTop: '4px' }}
              >
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <small style={{ color: '#888' }}>
                Visibilidade: <strong>{form.visibilidade === 'publica' ? '🌐 Pública (todos veem)' : '🔒 Apenas sócios'}</strong>
              </small>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#555' }}>Conteúdo *</label>
              <textarea
                value={form.conteudo} onChange={e => setForm({ ...form, conteudo: e.target.value })} required rows={6}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#555' }}>Imagem (opcional)</label>
              <input type="file" accept="image/*" onChange={e => setImagem(e.target.files[0])}
                style={{ display: 'block', marginTop: '4px' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '12px', background: '#1b3d2f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              {loading ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Publicar Notícia'}
            </button>
          </form>
        </div>
      )}

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {noticias.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>Nenhuma notícia publicada.</p>}
        {noticias.map(n => (
          <div key={n.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px', display: 'flex', gap: '16px' }}>
            {n.imagem_url && (
              <img src={`http://localhost:3001${n.imagem_url}`} alt=""
                style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ background: corCategoria[n.categoria] || '#666', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                  {labelCategoria[n.categoria] || n.categoria}
                </span>
                <span style={{ background: n.visibilidade === 'publica' ? '#e3f2fd' : '#fff3e0', color: n.visibilidade === 'publica' ? '#1565c0' : '#e65100', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                  {n.visibilidade === 'publica' ? '🌐 Pública' : '🔒 Sócios'}
                </span>
              </div>
              <strong style={{ fontSize: '15px' }}>{n.titulo}</strong>
              <p style={{ color: '#666', fontSize: '13px', margin: '4px 0' }}>{n.conteudo.substring(0, 120)}...</p>
              <small style={{ color: '#999' }}>Por {n.autor_nome} — {new Date(n.created_at).toLocaleDateString('pt-BR')}</small>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => handleEditar(n)}
                style={{ border: 'none', background: '#f0f4f0', color: '#1b3d2f', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                Editar
              </button>
              <button onClick={() => handleExcluir(n.id)}
                style={{ border: 'none', background: '#ffeaea', color: '#c62828', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}