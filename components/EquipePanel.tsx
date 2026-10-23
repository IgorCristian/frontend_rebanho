import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, UserCircle2, Pencil, UserPlus, Mail, Unlink } from 'lucide-react';
import { api } from '../services/api';
import { Funcionario, Usuario, Papel, PAPEIS_LABEL, PAPEIS_VINCULADOS } from '../types';
import { Botao, Campo, Entrada, Selecao, Cartao, Selo, Janela, Vazio, Carregando, TituloSecao } from './ui';

interface Props {
  fazendaId: number;
  podeEditar: boolean;
}

export const EquipePanel: React.FC<Props> = ({ fazendaId, podeEditar }) => (
  <div className="space-y-6">
    <FuncionariosSecao fazendaId={fazendaId} podeEditar={podeEditar} />
    {podeEditar && <UsuariosSecao fazendaId={fazendaId} />}
  </div>
);

// ---------- Funcionários (entram pelo código + PIN da fazenda) ----------

const FuncionariosSecao: React.FC<Props> = ({ fazendaId, podeEditar }) => {
  const [lista, setLista] = useState<Funcionario[] | null>(null);
  const [editando, setEditando] = useState<Funcionario | 'novo' | null>(null);
  const [dados, setDados] = useState({ nome: '', funcao: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.listarFuncionarios(fazendaId).then(setLista).catch((err) => { toast.error(err.message); setLista([]); });
  useEffect(() => { carregar(); }, [fazendaId]);

  const abrir = (f: Funcionario | 'novo') => {
    setEditando(f);
    setDados(f === 'novo' ? { nome: '', funcao: '' } : { nome: f.nome, funcao: f.funcao || '' });
  };

  const salvar = async () => {
    if (!dados.nome.trim()) return toast.error('Informe o nome.');
    setSalvando(true);
    try {
      if (editando === 'novo') await api.criarFuncionario(fazendaId, dados);
      else if (editando) await api.editarFuncionario(fazendaId, editando.id, dados);
      setEditando(null);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (f: Funcionario) => {
    try {
      await api.editarFuncionario(fazendaId, f.id, { ativo: !f.ativo });
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <section>
      <TituloSecao
        titulo="Funcionários"
        descricao="Entram pelo código da fazenda + PIN e escolhem o próprio nome ao lançar."
        acao={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => abrir('novo')}>Adicionar</Botao>}
      />
      {lista === null ? <Carregando /> : lista.length === 0 ? (
        <Cartao><Vazio icone={<UserCircle2 />} titulo="Nenhum funcionário cadastrado" /></Cartao>
      ) : (
        <Cartao className="divide-y divide-gray-100">
          {lista.map(f => (
            <div key={f.id} className={`p-4 flex items-center justify-between gap-3 ${f.ativo ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <UserCircle2 className="text-gray-300 shrink-0" size={32} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">{f.nome} {!f.ativo && <Selo>Inativo</Selo>}</p>
                  {f.funcao && <p className="text-sm text-gray-500">{f.funcao}</p>}
                </div>
              </div>
              {podeEditar && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => abrir(f)} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100" title="Editar"><Pencil size={16} /></button>
                  <Botao variante="fantasma" onClick={() => alternarAtivo(f)}>{f.ativo ? 'Desativar' : 'Reativar'}</Botao>
                </div>
              )}
            </div>
          ))}
        </Cartao>
      )}

      <Janela titulo={editando === 'novo' ? 'Novo funcionário' : 'Editar funcionário'} aberta={!!editando} aoFechar={() => setEditando(null)} rodape={
        <>
          <Botao variante="secundario" onClick={() => setEditando(null)}>Cancelar</Botao>
          <Botao onClick={salvar} carregando={salvando}>Salvar</Botao>
        </>
      }>
        <Campo rotulo="Nome *"><Entrada autoFocus value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></Campo>
        <Campo rotulo="Função" dica="Ex.: Ordenhador, Tratador, Retireiro"><Entrada value={dados.funcao} onChange={e => setDados({ ...dados, funcao: e.target.value })} /></Campo>
        {editando === 'novo' && <p className="text-xs text-gray-400">Funcionários não são excluídos (o histórico aponta para eles); desative quando sair da fazenda.</p>}
      </Janela>
    </section>
  );
};

// ---------- Usuários com login próprio (produtor, veterinário, inseminador) ----------

const UsuariosSecao: React.FC<{ fazendaId: number }> = ({ fazendaId }) => {
  const [lista, setLista] = useState<Usuario[] | null>(null);
  const [aberto, setAberto] = useState(false);
  const vazio = { email: '', nome: '', papel: 'produtor' as Papel, senha: '', telefone: '' };
  const [dados, setDados] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.listarUsuariosFazenda(fazendaId).then(setLista).catch((err) => { toast.error(err.message); setLista([]); });
  useEffect(() => { carregar(); }, [fazendaId]);

  const salvar = async () => {
    if (!dados.email.trim()) return toast.error('Informe o e-mail.');
    setSalvando(true);
    try {
      const usuario = await api.vincularUsuario(fazendaId, { ...dados, email: dados.email.trim(), nome: dados.nome.trim() });
      toast.success(usuario.conta_criada ? 'Conta criada e vinculada! Passe o e-mail e a senha para a pessoa.' : `${usuario.nome} foi vinculado à fazenda.`);
      setAberto(false);
      setDados(vazio);
      carregar();
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  const desvincular = async (u: Usuario) => {
    if (!confirm(`Tirar ${u.nome} desta fazenda? A conta continua existindo.`)) return;
    try {
      await api.desvincularUsuario(fazendaId, u.id);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <section>
      <TituloSecao
        titulo="Usuários com login"
        descricao="Produtor, veterinário e inseminador entram com e-mail e senha e só veem as fazendas em que foram incluídos."
        acao={<Botao icone={<UserPlus size={18} />} onClick={() => setAberto(true)}>Incluir</Botao>}
      />
      {lista === null ? <Carregando /> : lista.length === 0 ? (
        <Cartao><Vazio icone={<UserPlus />} titulo="Ninguém incluído ainda" /></Cartao>
      ) : (
        <Cartao className="divide-y divide-gray-100">
          {lista.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                  {u.nome} <Selo cor={u.papel === 'veterinario' ? 'verde' : u.papel === 'inseminador' ? 'amarelo' : 'azul'}>{PAPEIS_LABEL[u.papel]}</Selo>
                  {!u.ativo && <Selo cor="vermelho">Conta desativada</Selo>}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 truncate"><Mail size={14} />{u.email}</p>
              </div>
              <button onClick={() => desvincular(u)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Tirar da fazenda"><Unlink size={18} /></button>
            </div>
          ))}
        </Cartao>
      )}

      <Janela titulo="Incluir usuário na fazenda" aberta={aberto} aoFechar={() => setAberto(false)} rodape={
        <>
          <Botao variante="secundario" onClick={() => setAberto(false)}>Cancelar</Botao>
          <Botao onClick={salvar} carregando={salvando}>Incluir</Botao>
        </>
      }>
        <Campo rotulo="E-mail *" dica="Se a pessoa já tem conta (ex.: veterinário de outra fazenda), basta o e-mail.">
          <Entrada type="email" autoFocus value={dados.email} onChange={e => setDados({ ...dados, email: e.target.value })} />
        </Campo>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Só para conta nova</p>
          <Campo rotulo="Nome"><Entrada value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></Campo>
          <Campo rotulo="Perfil">
            <Selecao value={dados.papel} onChange={e => setDados({ ...dados, papel: e.target.value as Papel })}>
              {PAPEIS_VINCULADOS.map(p => <option key={p} value={p}>{PAPEIS_LABEL[p]}</option>)}
            </Selecao>
          </Campo>
          <Campo rotulo="Telefone"><Entrada type="tel" value={dados.telefone} onChange={e => setDados({ ...dados, telefone: e.target.value })} /></Campo>
          <Campo rotulo="Senha inicial" dica="Mínimo de 6 caracteres."><Entrada value={dados.senha} onChange={e => setDados({ ...dados, senha: e.target.value })} /></Campo>
        </div>
      </Janela>
    </section>
  );
};
