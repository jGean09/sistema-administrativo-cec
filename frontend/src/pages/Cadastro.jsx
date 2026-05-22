import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const campoVazio = {
  nome: '', data_nascimento: '', genero: 'M', naturalidade: '',
  cpf: '', rg: '', nome_pai: '', nome_mae: '', telefone: '', email: '',
  endereco_logradouro: '', endereco_numero: '', endereco_bairro: '',
  endereco_cidade: '', endereco_uf: 'RN', endereco_cep: '',
  instituicao: '', escolaridade: 'Superior incompleto', periodo_serie: '', ano_inclusao: '',
  departamento: 'masculino',
  alergias: 'Não', medicacao: 'Não', doenca_cronica: 'Não',
  deficiencia: 'Não', tratamento_medico: 'Não',
};

export default function Cadastro() {
  const [form, setForm] = useState(campoVazio);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const set = (campo) => (e) => setForm(prev => ({ ...prev, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await api.post('/socios', form);
      setSucesso(res.data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="page-center">
        <div className="card sucesso-card">
          <div className="sucesso-icon">✓</div>
          <h2>Cadastro realizado!</h2>
          <p>Bem-vindo(a), <strong>{sucesso.socio.nome}</strong>!</p>
          <div className="acesso-info">
            <p><strong>Matrícula:</strong> {sucesso.socio.matricula}</p>
            <p><strong>Login:</strong> {sucesso.socio.email}</p>
            <p><strong>Senha padrão:</strong> Seu CPF (só números)</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-page">
      <div className="cadastro-header">
        <div className="logo-mini">CEC</div>
        <div>
          <h1>Cadastro de Sócio(a)</h1>
          <p>Casa do Estudante de Caicó</p>
        </div>
        <Link to="/login" className="btn-voltar">← Já tenho conta</Link>
      </div>

      <form onSubmit={handleSubmit} className="cadastro-form">

        <section className="form-section">
          <h3>Dados pessoais</h3>
          <div className="form-grid">
            <div className="field span-2">
              <label>Nome completo *</label>
              <input type="text" value={form.nome} onChange={set('nome')} required />
            </div>
            <div className="field">
              <label>Data de nascimento *</label>
              <input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} required />
            </div>
            <div className="field">
              <label>Gênero *</label>
              <select value={form.genero} onChange={set('genero')} required>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="field">
              <label>CPF *</label>
              <input type="text" value={form.cpf} onChange={set('cpf')}
                placeholder="000.000.000-00" required />
            </div>
            <div className="field">
              <label>RG</label>
              <input type="text" value={form.rg} onChange={set('rg')} />
            </div>
            <div className="field">
              <label>Naturalidade</label>
              <input type="text" value={form.naturalidade} onChange={set('naturalidade')}
                placeholder="Cidade/UF" />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input type="text" value={form.telefone} onChange={set('telefone')}
                placeholder="(84) 99999-9999" />
            </div>
            <div className="field">
              <label>Nome do pai</label>
              <input type="text" value={form.nome_pai} onChange={set('nome_pai')} />
            </div>
            <div className="field">
              <label>Nome da mãe</label>
              <input type="text" value={form.nome_mae} onChange={set('nome_mae')} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Contato e acesso</h3>
          <div className="form-grid">
            <div className="field span-2">
              <label>E-mail * (será seu login)</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="seu@email.com" required />
              <span className="field-hint">Sua senha inicial será o CPF (sem pontos e traço)</span>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Endereço</h3>
          <div className="form-grid">
            <div className="field span-2">
              <label>Logradouro</label>
              <input type="text" value={form.endereco_logradouro} onChange={set('endereco_logradouro')} />
            </div>
            <div className="field">
              <label>Número</label>
              <input type="text" value={form.endereco_numero} onChange={set('endereco_numero')} />
            </div>
            <div className="field">
              <label>Bairro</label>
              <input type="text" value={form.endereco_bairro} onChange={set('endereco_bairro')} />
            </div>
            <div className="field">
              <label>Cidade</label>
              <input type="text" value={form.endereco_cidade} onChange={set('endereco_cidade')} />
            </div>
            <div className="field">
              <label>UF</label>
              <input type="text" value={form.endereco_uf} onChange={set('endereco_uf')} maxLength={2} />
            </div>
            <div className="field">
              <label>CEP</label>
              <input type="text" value={form.endereco_cep} onChange={set('endereco_cep')} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Dados acadêmicos</h3>
          <div className="form-grid">
            <div className="field span-2">
              <label>Instituição de ensino</label>
              <input type="text" value={form.instituicao} onChange={set('instituicao')}
                placeholder="Ex: UFRN, UFERSA, IFRN..." />
            </div>
            <div className="field">
              <label>Escolaridade</label>
              <select value={form.escolaridade} onChange={set('escolaridade')}>
                <option>Ensino fundamental</option>
                <option>Ensino médio incompleto</option>
                <option>Ensino médio completo</option>
                <option>Superior incompleto</option>
                <option>Superior completo</option>
              </select>
            </div>
            <div className="field">
              <label>Período / Série</label>
              <input type="text" value={form.periodo_serie} onChange={set('periodo_serie')}
                placeholder="Ex: 5º período" />
            </div>
            <div className="field">
              <label>Ano de inclusão</label>
              <input type="text" value={form.ano_inclusao} onChange={set('ano_inclusao')}
                placeholder="Ex: 2024.1" />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Departamento</h3>
          <div className="radio-group">
            <label className="radio-opt">
              <input type="radio" name="dep" value="masculino"
                checked={form.departamento === 'masculino'}
                onChange={set('departamento')} />
              Departamento Masculino
            </label>
            <label className="radio-opt">
              <input type="radio" name="dep" value="feminino"
                checked={form.departamento === 'feminino'}
                onChange={set('departamento')} />
              Departamento Feminino
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>Informações de saúde</h3>
          <div className="form-grid">
            {[
              ['alergias', 'Possui alergias?'],
              ['medicacao', 'Faz uso de medicação?'],
              ['doenca_cronica', 'Possui doença crônica?'],
              ['deficiencia', 'Possui deficiência?'],
              ['tratamento_medico', 'Faz tratamento médico?'],
            ].map(([campo, label]) => (
              <div className="field" key={campo}>
                <label>{label}</label>
                <input type="text" value={form[campo]} onChange={set(campo)}
                  placeholder="Não / descreva se sim" />
              </div>
            ))}
          </div>
        </section>

        {erro && <div className="erro-msg">{erro}</div>}

        <div className="form-actions">
          <Link to="/login" className="btn-secondary">Cancelar</Link>
          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Finalizar cadastro'}
          </button>
        </div>

      </form>
    </div>
  );
}
