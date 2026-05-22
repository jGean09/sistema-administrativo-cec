import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CadastroInterno.css';

const INITIAL_STATE = {
  nome: '', data_nascimento: '', naturalidade: '', rg: '', cpf: '',
  genero: 'M', telefone: '', email: '',
  nome_pai: '', nome_mae: '',
  endereco_logradouro: '', endereco_numero: '', endereco_bairro: '',
  endereco_cidade: '', endereco_uf: 'RN', endereco_cep: '',
  instituicao: '', escolaridade: '', curso: '',
  periodo_serie: '', ano_inclusao: '', data_inclusao: '',
  departamento: 'masculino', quarto: '',
  cargo: '', tipo_usuario: 'socio',
  alergias: 'Não', medicacao: 'Não', doenca_cronica: 'Não',
  deficiencia: 'Não', tratamento_medico: 'Não'
};

export default function CadastroInterno() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/socios', form);
      alert('Sócio cadastrado com sucesso!');
      navigate('/admin/socios');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <header>
        <h2>Novo Cadastro de Sócio</h2>
        <p>Preencha os dados para geração automática da ficha individual.</p>
      </header>

      <form onSubmit={handleSubmit}>

        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <section className="admin-section">
          <h3>1. Dados Pessoais</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Nome Completo *</label>
              <input className="admin-input" name="nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div className="admin-field">
              <label>Data de Nascimento</label>
              <input className="admin-input" type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Naturalidade (Cidade/UF)</label>
              <input className="admin-input" name="naturalidade" value={form.naturalidade} onChange={handleChange} placeholder="Ex: Florânia/RN" />
            </div>
            <div className="admin-field">
              <label>RG</label>
              <input className="admin-input" name="rg" value={form.rg} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>CPF *</label>
              <input className="admin-input" name="cpf" value={form.cpf} onChange={handleChange} required />
            </div>
            <div className="admin-field">
              <label>Gênero</label>
              <select className="admin-input" name="genero" value={form.genero} onChange={handleChange}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Telefone</label>
              <input className="admin-input" name="telefone" value={form.telefone} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>E-mail *</label>
              <input className="admin-input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: FILIAÇÃO */}
        <section className="admin-section">
          <h3>2. Filiação</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Nome do Pai</label>
              <input className="admin-input" name="nome_pai" value={form.nome_pai} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>Nome da Mãe</label>
              <input className="admin-input" name="nome_mae" value={form.nome_mae} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: ENDEREÇO */}
        <section className="admin-section">
          <h3>3. Endereço de Origem (Familiar)</h3>
          <div className="admin-grid">
            <div className="admin-field full">
              <label>Rua/Logradouro</label>
              <input className="admin-input" name="endereco_logradouro" value={form.endereco_logradouro} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Número</label>
              <input className="admin-input" name="endereco_numero" value={form.endereco_numero} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Bairro</label>
              <input className="admin-input" name="endereco_bairro" value={form.endereco_bairro} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Cidade</label>
              <input className="admin-input" name="endereco_cidade" value={form.endereco_cidade} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>UF</label>
              <input className="admin-input" name="endereco_uf" value={form.endereco_uf} onChange={handleChange} placeholder="Ex: RN" />
            </div>
            <div className="admin-field">
              <label>CEP</label>
              <input className="admin-input" name="endereco_cep" value={form.endereco_cep} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* SEÇÃO 4: ACADÊMICO E CEC */}
        <section className="admin-section">
          <h3>4. Vida Acadêmica e Institucional</h3>
          <div className="admin-grid">
            <div className="admin-field">
              <label>Instituição de Ensino</label>
              <input className="admin-input" name="instituicao" value={form.instituicao} onChange={handleChange} placeholder="Ex: UFRN" />
            </div>
            <div className="admin-field">
              <label>Escolaridade</label>
              <input className="admin-input" name="escolaridade" value={form.escolaridade} onChange={handleChange} placeholder="Ex: Ensino médio completo" />
            </div>
            <div className="admin-field">
              <label>Curso</label>
              <input className="admin-input" name="curso" value={form.curso} onChange={handleChange} placeholder="Ex: Engenharia Civil" />
            </div>
            <div className="admin-field">
              <label>Período/Série</label>
              <input className="admin-input" name="periodo_serie" value={form.periodo_serie} onChange={handleChange} placeholder="Ex: 5º período" />
            </div>
            <div className="admin-field">
              <label>Ano de Inclusão na CEC</label>
              <input className="admin-input" name="ano_inclusao" value={form.ano_inclusao} onChange={handleChange} placeholder="Ex: 2024.1" />
            </div>
            <div className="admin-field">
              <label>Data de Inclusão na CEC</label>
              <input className="admin-input" type="date" name="data_inclusao" value={form.data_inclusao} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Departamento</label>
              <select className="admin-input" name="departamento" value={form.departamento} onChange={handleChange}>
                <option value="masculino">Sede Própria (Masculino)</option>
                <option value="feminino">Dep. Feminino</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Quarto</label>
              <input className="admin-input" name="quarto" value={form.quarto} onChange={handleChange} placeholder="Ex: 3A" />
            </div>
            <div className="admin-field">
              <label>Cargo na CEC</label>
              <input className="admin-input" name="cargo" value={form.cargo} onChange={handleChange} placeholder="Ex: Sócio, Diretor..." />
            </div>
            <div className="admin-field">
              <label>Nível de Acesso</label>
              <select className="admin-input" name="tipo_usuario" value={form.tipo_usuario} onChange={handleChange}>
                <option value="socio">Sócio (Comum)</option>
                <option value="diretoria">Diretoria</option>
                <option value="secretario">Secretário</option>
                <option value="presidente">Presidente</option>
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
              <input className="admin-input" name="alergias" value={form.alergias} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Faz uso de medicação? Qual?</label>
              <input className="admin-input" name="medicacao" value={form.medicacao} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Doença crônica? Qual?</label>
              <input className="admin-input" name="doenca_cronica" value={form.doenca_cronica} onChange={handleChange} />
            </div>
            <div className="admin-field">
              <label>Possui deficiência? Qual?</label>
              <input className="admin-input" name="deficiencia" value={form.deficiencia} onChange={handleChange} />
            </div>
            <div className="admin-field full">
              <label>Faz algum tratamento médico? Qual?</label>
              <input className="admin-input" name="tratamento_medico" value={form.tratamento_medico} onChange={handleChange} />
            </div>
          </div>
        </section>

        <div className="admin-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancelar</button>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </div>

      </form>
    </div>
  );
}