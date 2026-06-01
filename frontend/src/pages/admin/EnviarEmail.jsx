// ============================================================
// Página de envio de e-mail — área da diretoria
// Permite selecionar destinatários e enviar mensagem (agora com anexos)
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function EnviarEmail() {
  const { usuario } = useAuth();
  const [socios, setSocios] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('selecionados');
  const [departamento, setDepartamento] = useState('masculino');
  const [status, setStatus] = useState('ativo');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [anexos, setAnexos] = useState(null); // Novo estado para os anexos
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    api.get('/email/destinatarios')
      .then(res => setSocios(Array.isArray(res.data) ? res.data : []));
  }, []);

  const sociosFiltrados = socios.filter(s =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSelecionado = (id) => {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    const ids = sociosFiltrados.map(s => s.id);
    setSelecionados(ids);
  };

  const limparSelecao = () => setSelecionados([]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!assunto || !mensagem) return alert('Preencha o assunto e a mensagem.');
    if (tipo === 'selecionados' && selecionados.length === 0) {
      return alert('Selecione ao menos um sócio.');
    }

    setEnviando(true);
    setResultado(null);

    // Substituindo JSON por FormData para suportar arquivos
    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('departamento', departamento);
    formData.append('status', status);
    formData.append('assunto', assunto);
    formData.append('mensagem', mensagem);
    
    // Arrays precisam ser stringificados no FormData
    formData.append('ids', JSON.stringify(selecionados)); 

    // Adiciona os arquivos ao FormData, se houver
    if (anexos) {
      for (let i = 0; i < anexos.length; i++) {
        formData.append('anexos', anexos[i]);
      }
    }

    try {
      // Axios configura automaticamente os headers (multipart/form-data) quando enviamos FormData
      const res = await api.post('/email/enviar', formData);
      
      setResultado(res.data);
      setAssunto('');
      setMensagem('');
      setSelecionados([]);
      setAnexos(null);
      // Limpa o input de arquivo visualmente
      document.getElementById('input-anexos').value = ""; 
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar e-mail.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h2 style={{ marginBottom: '4px' }}>Enviar E-mail</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Remetente: <strong>casaestudantecaico@gmail.com</strong>
      </p>

      {/* RESULTADO DO ENVIO */}
      {resultado && (
        <div style={{
          background: resultado.erros === 0 ? '#e8f5e9' : '#fff3e0',
          border: `1px solid ${resultado.erros === 0 ? '#a5d6a7' : '#ffcc02'}`,
          borderRadius: '10px', padding: '16px', marginBottom: '24px'
        }}>
          <strong>{resultado.message}</strong>
          {resultado.erros > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#e65100' }}>
              {resultado.erros} e-mail(s) falharam.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* COLUNA ESQUERDA — Destinatários */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Destinatários</h3>

          {/* Tipo de envio */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
              Tipo de envio
            </label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
            >
              <option value="selecionados">Sócios selecionados</option>
              <option value="todos">Todos os sócios ativos</option>
              <option value="departamento">Por departamento</option>
              <option value="status">Por status</option>
            </select>
          </div>

          {/* Filtro de departamento */}
          {tipo === 'departamento' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                Departamento
              </label>
              <select
                value={departamento}
                onChange={e => setDepartamento(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          )}

          {/* Filtro de status */}
          {tipo === 'status' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="suspenso">Suspensos</option>
              </select>
            </div>
          )}

          {/* Lista de sócios para seleção */}
          {tipo === 'selecionados' && (
            <>
              <input
                placeholder="Buscar sócio..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={selecionarTodos}
                  style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#f5f5f5' }}
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={limparSelecao}
                  style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#f5f5f5' }}
                >
                  Limpar
                </button>
                <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>
                  {selecionados.length} selecionado(s)
                </span>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                {sociosFiltrados.map(s => (
                  <div
                    key={s.id}
                    onClick={() => toggleSelecionado(s.id)}
                    style={{
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5',
                      background: selecionados.includes(s.id) ? '#e8f5e9' : '#fff',
                      display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.includes(s.id)}
                      onChange={() => toggleSelecionado(s.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{s.nome}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Resumo para outros tipos */}
          {tipo !== 'selecionados' && (
            <div style={{ background: '#f0f4f0', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#444' }}>
              {tipo === 'todos' && `Será enviado para todos os ${socios.filter(s => s.status_socio === 'ativo').length} sócios ativos.`}
              {tipo === 'departamento' && `Será enviado para sócios do dep. ${departamento}.`}
              {tipo === 'status' && `Será enviado para sócios com status: ${status}.`}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA — Mensagem e Anexos */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Mensagem</h3>
          <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                Assunto *
              </label>
              <input
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                required
                placeholder="Ex: Reunião de assembleia — 15/06"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                Mensagem *
              </label>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                required
                rows={8}
                placeholder="Digite a mensagem aqui..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* NOVO CAMPO: ANEXOS */}
            <div>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                Anexos (Opcional)
              </label>
              <input
                id="input-anexos"
                type="file"
                multiple
                onChange={e => setAnexos(e.target.files)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', background: '#fbfbfc' }}
              />
              <span style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'block' }}>
                Você pode selecionar múltiplos arquivos (PDFs, Imagens, Documentos).
              </span>
            </div>

            <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#666' }}>
              <strong>Preview do remetente:</strong><br />
              De: Casa do Estudante de Caicó &lt;casaestudantecaico@gmail.com&gt;<br />
              Assinado por: {usuario?.nome}
            </div>
            
            <button
              type="submit"
              disabled={enviando}
              style={{
                padding: '12px', background: enviando ? '#ccc' : '#1b3d2f',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: enviando ? 'not-allowed' : 'pointer',
                fontWeight: 'bold', fontSize: '14px'
              }}
            >
              {enviando ? 'Enviando...' : '📧 Enviar E-mail'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}