import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, UserCog, Mail } from 'lucide-react';
import { api } from '../services/api';
import { Usuario } from '../types';
import { Botao, Campo, Entrada, Cartao, Selo, Janela, Vazio, Carregando } from './ui';

// Só o administrador vê esta tela: consultores não se cadastram sozinhos
export const ConsultoresPanel: React.FC = () => {
  const [consultores, setConsultores] = useState<Usuario[] | null>(null);
  const [criando, setCriando] = useState(false);
  const [dados, setDados] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.listarConsultores().then(setConsultores).catch((err) => { toast.error(err.message); setConsultores([]); });
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!dados.nome.trim() || !dados.email.trim()) return toast.error('Informe nome e e-mail.');
    if (dados.senha.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');
    setSalvando(true);
    try {
      await api.criarConsultor({ ...dados, nome: dados.nome.trim(), email: dados.email.trim() });
      toast.success('Consultor cadastrado! Passe o e-mail e a senha para ele.');
      setCriando(false);
      setDados({ nome: '', email: '', telefone: '', senha: '' });
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (c: Usuario) => {
    if (c.ativo && !confirm(`Desativar ${c.nome}? Ele não vai conseguir mais entrar no app.`)) return;
    try {
      await api.alterarAtivoUsuario(c.id, !c.ativo);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultores</h1>
          <p className="text-sm text-gray-500">Quem implanta e acompanha as fazendas</p>
        </div>
        <Botao icone={<Plus size={18} />} onClick={() => setCriando(true)}>Novo consultor</Botao>
      </div>

      {consultores === null ? <Carregando /> : consultores.length === 0 ? (
        <Cartao><Vazio icone={<UserCog />} titulo="Nenhum consultor cadastrado" /></Cartao>
      ) : (
        <Cartao className="divide-y divide-gray-100">
          {consultores.map(c => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex items-center gap-2">{c.nome} {!c.ativo && <Selo cor="vermelho">Desativado</Selo>}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 truncate"><Mail size={14} />{c.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.total_fazendas} fazenda(s)</p>
              </div>
              <Botao variante={c.ativo ? 'perigo' : 'secundario'} onClick={() => alternarAtivo(c)}>{c.ativo ? 'Desativar' : 'Reativar'}</Botao>
            </div>
          ))}
        </Cartao>
      )}

      <Janela titulo="Novo consultor" aberta={criando} aoFechar={() => setCriando(false)} rodape={
        <>
          <Botao variante="secundario" onClick={() => setCriando(false)}>Cancelar</Botao>
          <Botao onClick={salvar} carregando={salvando}>Cadastrar</Botao>
        </>
      }>
        <Campo rotulo="Nome *"><Entrada autoFocus value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></Campo>
        <Campo rotulo="E-mail *"><Entrada type="email" value={dados.email} onChange={e => setDados({ ...dados, email: e.target.value })} /></Campo>
        <Campo rotulo="Telefone"><Entrada type="tel" value={dados.telefone} onChange={e => setDados({ ...dados, telefone: e.target.value })} /></Campo>
        <Campo rotulo="Senha inicial *" dica="Mínimo de 6 caracteres. Passe para o consultor junto com o e-mail.">
          <Entrada type="text" value={dados.senha} onChange={e => setDados({ ...dados, senha: e.target.value })} />
        </Campo>
      </Janela>
    </div>
  );
};
