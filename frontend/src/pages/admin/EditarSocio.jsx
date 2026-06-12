import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CadastroInterno.css';

export default function EditarSocio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/socios/${id}`)
      .then(res => setForm(res.data))
      .catch(err => {
        console.error(err);
        alert('Erro ao carregar sócio.');
        navigate('/admin/socios');
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/socios/${id}`, form);
      alert('Sócio atualizado com sucesso!');
      navigate('/admin/socios');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar.');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="admin-loading">Carregando dados do sócio...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header-flex">
        <div>
          <h2>Editar Sócio</h2>
          <p className="admin-subtitle">Matrícula: <strong>{form.matricula}</strong></p>
        </div>

        {/* ── Botões de PDF ── */}
        <div className="admin-header-actions">
          <button
            className="btn-pdf-ficha"
            onClick={() => window.open(`${process.env.REACT_APP_API_URL}/socios/${id}/ficha`, '_blank')}
          >
            Imprimir Ficha PDF
          </button>

          <button
            className="btn-pdf-declaracao"
            onClick={() => window.open(`${process.env.REACT_APP_API_URL}/socios/${id}/declaracao`, '_blank')}
          >
            Declaração PDF
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit}>

        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <section className="admin-section">
          <h3>1. Dados Pessoais</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Nome Completo *</label>
              <input className="admin-input" name="nome" value={form.nome || ''} onChange={handleChange} required />
            </div>
            <div className="admin-field">
              <label>Data de Nascimento</label>
              <input className="admin-input" type="date" name="data_nascimento"
                value={form.data_nascimento ? form.data_nascimento.split('T')[0] : ''}
                onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Naturalidade (Cidade/UF)</label>
              <input className="admin-input" name="naturalidade" value={form.naturalidade || ''} onChange={handleChange} placeholder="Ex: Florânia/RN" />
            </div>
            <div className="admin-field">
              <label>RG</label>
              <input className="admin-input" name="rg" value={form.rg || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>CPF *</label>
              <input className="admin-input" name="cpf" value={form.cpf || ''} onChange={handleChange} required />
            </div>
            <div className="admin-field">
              <label>Gênero</label>
              <select className="admin-input" name="genero" value={form.genero || 'M'} onChange={handleChange}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Telefone</label>
              <input className="admin-input" name="telefone" value={form.telefone || ''} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>E-mail *</label>
              <input className="admin-input" type="email" name="email" value={form.email || ''} onChange={handleChange} required />
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: FILIAÇÃO */}
        <section className="admin-section">
          <h3>2. Filiação</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Nome do Pai</label>
              <input className="admin-input" name="nome_pai" value={form.nome_pai || ''} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>Nome da Mãe</label>
              <input className="admin-input" name="nome_mae" value={form.nome_mae || ''} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: ENDEREÇO */}
        <section className="admin-section">
          <h3>3. Endereço de Origem (Familiar)</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Rua/Logradouro</label>
              <input className="admin-input" name="endereco_logradouro" value={form.endereco_logradouro || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Número</label>
              <input className="admin-input" name="endereco_numero" value={form.endereco_numero || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Bairro</label>
              <input className="admin-input" name="endereco_bairro" value={form.endereco_bairro || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Cidade</label>
              <input className="admin-input" name="endereco_cidade" value={form.endereco_cidade || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>UF</label>
              <input className="admin-input" name="endereco_uf" value={form.endereco_uf || ''} onChange={handleChange} placeholder="Ex: RN" />
            </div>
            <div className="admin-field">
              <label>CEP</label>
              <input className="admin-input" name="endereco_cep" value={form.endereco_cep || ''} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SEÇÃO 4: ACADÊMICO E CEC */}
        <section className="admin-section">
          <h3>4. Vida Acadêmica e Institucional</h3>
          <div className="admin-grid">
            <div className="admin-field">
              <label>Instituição de Ensino</label>
              <input className="admin-input" name="instituicao" value={form.instituicao || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Escolaridade</label>
              <input className="admin-input" name="escolaridade" value={form.escolaridade || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Curso</label>
              <input className="admin-input" name="curso" value={form.curso || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Período/Série</label>
              <input className="admin-input" name="periodo_serie" value={form.periodo_serie || ''} onChange={handleChange} placeholder="Ex: 5º período" />
            </div>
            <div className="admin-field">
              <label>Ano de Inclusão na CEC</label>
              <input className="admin-input" name="ano_inclusao" value={form.ano_inclusao || ''} onChange={handleChange} placeholder="Ex: 2024.1" />
            </div>
            <div className="admin-field">
              <label>Data de Inclusão na CEC</label>
              <input className="admin-input" type="date" name="data_inclusao"
                value={form.data_inclusao ? form.data_inclusao.split('T')[0] : ''}
                onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Departamento</label>
              <select className="admin-input" name="departamento" value={form.departamento || 'masculino'} onChange={handleChange}>
                <option value="masculino">Sede Própria (Masculino)</option>
                <option value="feminino">Dep. Feminino</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Quarto</label>
              <input className="admin-input" name="quarto" value={form.quarto || ''} onChange={handleChange} placeholder="Ex: 3A" />
            </div>
            <div className="admin-field">
              <label>Cargo na CEC</label>
              <input className="admin-input" name="cargo" value={form.cargo || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Nível de Acesso</label>
              <select className="admin-input" name="tipo_usuario" value={form.tipo_usuario || 'socio'} onChange={handleChange}>
                <option value="socio">Sócio (Comum)</option>
                <option value="diretoria">Diretoria</option>
                <option value="secretario">Secretário</option>
                <option value="presidente">Presidente</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Status</label>
              <select className="admin-input" name="status_socio" value={form.status_socio || 'ativo'} onChange={handleChange}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
          </div>
        </section>

        {/* SEÇÃO 5: SAÚDE */}
        <section className="admin-section">
          <h3>5. Informações de Saúde</h3>
          <div className="admin-grid">
            <div className="admin-field">
              <label>Possui alergias? Qual?</label>
              <input className="admin-input" name="alergias" value={form.alergias || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Faz uso de medicação? Qual?</label>
              <input className="admin-input" name="medicacao" value={form.medicacao || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Doença crônica? Qual?</label>
              <input className="admin-input" name="doenca_cronica" value={form.doenca_cronica || ''} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Possui deficiência? Qual?</label>
              <input className="admin-input" name="deficiencia" value={form.deficiencia || ''} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>Faz algum tratamento médico? Qual?</label>
              <input className="admin-input" name="tratamento_medico" value={form.tratamento_medico || ''} onChange={handleChange} />
            </div>
          </div>
        </section>

        <div className="admin-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/admin/socios')}>Cancelar</button>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

      </form>
    </div>
  );
}