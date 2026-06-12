// ============================================================
// Página de envio de e-mail — área da diretoria
// Permite selecionar destinatários e enviar mensagem (agora com anexos)
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './EnviarEmail.css';

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
  const [anexos, setAnexos] = useState(null);
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

    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('departamento', departamento);
    formData.append('status', status);
    formData.append('assunto', assunto);
    formData.append('mensagem', mensagem);
    formData.append('ids', JSON.stringify(selecionados)); 

    if (anexos) {
      for (let i = 0; i < anexos.length; i++) {
        formData.append('anexos', anexos[i]);
      }
    }

    try {
      const res = await api.post('/email/enviar', formData);
      
      setResultado(res.data);
      setAssunto('');
      setMensagem('');
      setSelecionados([]);
      setAnexos(null);
      document.getElementById('input-anexos').value = ""; 
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar e-mail.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="email-container">
      <h2 className="email-title">Enviar E-mail</h2>
      <p className="email-subtitle">
        Remetente: <strong>casaestudantecaico@gmail.com</strong>
      </p>

      {/* RESULTADO DO ENVIO */}
      {resultado && (
        <div className={`email-alert ${resultado.erros === 0 ? 'success' : 'warning'}`}>
          <strong>{resultado.message}</strong>
          {resultado.erros > 0 && (
            <p className="email-alert-error-msg">
              {resultado.erros} e-mail(s) falharam.
            </p>
          )}
        </div>
      )}

      <div className="email-grid">

        {/* COLUNA ESQUERDA — Destinatários */}
        <div className="email-card">
          <h3>Destinatários</h3>

          {/* Tipo de envio */}
          <div className="email-form-group">
            <label className="email-label">Tipo de envio</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="email-select"
            >
              <option value="selecionados">Sócios selecionados</option>
              <option value="todos">Todos os sócios ativos</option>
              <option value="departamento">Por departamento</option>
              <option value="status">Por status</option>
            </select>
          </div>

          {/* Filtro de departamento */}
          {tipo === 'departamento' && (
            <div className="email-form-group">
              <label className="email-label">Departamento</label>
              <select
                value={departamento}
                onChange={e => setDepartamento(e.target.value)}
                className="email-select"
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          )}

          {/* Filtro de status */}
          {tipo === 'status' && (
            <div className="email-form-group">
              <label className="email-label">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="email-select"
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
                className="email-input"
                style={{ marginBottom: '8px' }} // Mantido inline apenas o margin dinâmico temporário se precisar
              />
              <div className="email-actions-row">
                <button
                  type="button"
                  onClick={selecionados.length === sociosFiltrados.length ? limparSelecao : selecionarTodos}
                  className="btn-email-action"
                >
                  {selecionados.length === sociosFiltrados.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
                <span className="email-selecionados-count">
                  {selecionados.length} selecionado(s)
                </span>
              </div>
              <div className="email-list-container">
                {sociosFiltrados.map(s => (
                  <div
                    key={s.id}
                    onClick={() => toggleSelecionado(s.id)}
                    className={`email-list-item ${selecionados.includes(s.id) ? 'selected' : 'unselected'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.includes(s.id)}
                      onChange={() => toggleSelecionado(s.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div>
                      <div className="email-item-name">{s.nome}</div>
                      <div className="email-item-email">{s.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Resumo para outros tipos */}
          {tipo !== 'selecionados' && (
            <div className="email-summary-box">
              {tipo === 'todos' && `Será enviado para todos os ${socios.filter(s => s.status_socio === 'ativo').length} sócios ativos.`}
              {tipo === 'departamento' && `Será enviado para sócios do dep. ${departamento}.`}
              {tipo === 'status' && `Será enviado para sócios com status: ${status}.`}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA — Mensagem e Anexos */}
        <div className="email-card">
          <h3>Mensagem</h3>
          <form onSubmit={handleEnviar} className="email-form-layout">
            <div>
              <label className="email-label">Assunto *</label>
              <input
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                required
                placeholder="Ex: Reunião de assembleia — 15/06"
                className="email-input"
              />
            </div>
            <div>
              <label className="email-label">Mensagem *</label>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                required
                rows={8}
                placeholder="Digite a mensagem aqui..."
                className="email-textarea"
              />
            </div>

            {/* NOVO CAMPO: ANEXOS */}
            <div>
              <label className="email-label">Anexos (Opcional)</label>
              <input
                id="input-anexos"
                type="file"
                multiple
                onChange={e => setAnexos(e.target.files)}
                className="email-file-input"
              />
              <span className="email-help-text">
                Você pode selecionar múltiplos arquivos (PDFs, Imagens, Documentos).
              </span>
            </div>

            <div className="email-preview-box">
              <strong>Preview do remetente:</strong><br />
              De: Casa do Estudante de Caicó &lt;casaestudantecaico@gmail.com&gt;<br />
              Assinado por: {usuario?.nome}
            </div>
            
            <button
              type="submit"
              disabled={enviando}
              className={`btn-enviar-email ${enviando ? 'disabled' : 'active'}`}
            >
              {enviando ? 'Enviando...' : '📧 Enviar E-mail'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}