import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Layers, Pencil } from 'lucide-react';
import { api } from '../services/api';
import { Lote } from '../types';
import { Botao, Campo, Entrada, AreaTexto, Cartao, Selo, Janela, Vazio, Carregando, TituloSecao } from './ui';

interface Props {
  fazendaId: number;
  podeEditar: boolean;
}

export const LotesPanel: React.FC<Props> = ({ fazendaId, podeEditar }) => {
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [editando, setEditando] = useState<Lote | 'novo' | null>(null);
  const [dados, setDados] = useState({ nome: '', descricao: '' });
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.listarLotes(fazendaId).then(setLotes).catch((err) => { toast.error(err.message); setLotes([]); });
  useEffect(() => { carregar(); }, [fazendaId]);

  const abrir = (l: Lote | 'novo') => {
    setEditando(l);
    setDados(l === 'novo' ? { nome: '', descricao: '' } : { nome: l.nome, descricao: l.descricao || '' });
  };

  const salvar = async () => {
    if (!dados.nome.trim()) return toast.error('Informe o nome do lote.');
    setSalvando(true);
    try {
      if (editando === 'novo') await api.criarLote(fazendaId, dados);
      else if (editando) await api.editarLote(fazendaId, editando.id, dados);
      setEditando(null);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (l: Lote) => {
    try {
      await api.editarLote(fazendaId, l.id, { ativo: !l.ativo });
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <section>
      <TituloSecao
        titulo="Lotes"
        descricao="Grupos de manejo/dieta (ex.: Alta produção, Pré-parto, Recria). O lote de cada animal vem dos eventos."
        acao={podeEditar && <Botao icone={<Plus size={18} />} onClick={() => abrir('novo')}>Novo lote</Botao>}
      />
      {lotes === null ? <Carregando /> : lotes.length === 0 ? (
        <Cartao><Vazio icone={<Layers />} titulo="Nenhum lote cadastrado" texto="Lotes são opcionais. Cadastre se a fazenda separa os animais por dieta ou manejo." /></Cartao>
      ) : (
        <Cartao className="divide-y divide-gray-100">
          {lotes.map(l => (
            <div key={l.id} className={`p-4 flex items-center justify-between gap-3 ${l.ativo ? '' : 'opacity-60'}`}>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 flex items-center gap-2">{l.nome} {!l.ativo && <Selo>Inativo</Selo>}</p>
                {l.descricao && <p className="text-sm text-gray-500">{l.descricao}</p>}
              </div>
              {podeEditar && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => abrir(l)} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100" title="Editar"><Pencil size={16} /></button>
                  <Botao variante="fantasma" onClick={() => alternarAtivo(l)}>{l.ativo ? 'Desativar' : 'Reativar'}</Botao>
                </div>
              )}
            </div>
          ))}
        </Cartao>
      )}

      <Janela titulo={editando === 'novo' ? 'Novo lote' : 'Editar lote'} aberta={!!editando} aoFechar={() => setEditando(null)} rodape={
        <>
          <Botao variante="secundario" onClick={() => setEditando(null)}>Cancelar</Botao>
          <Botao onClick={salvar} carregando={salvando}>Salvar</Botao>
        </>
      }>
        <Campo rotulo="Nome *"><Entrada autoFocus value={dados.nome} onChange={e => setDados({ ...dados, nome: e.target.value })} /></Campo>
        <Campo rotulo="Descrição"><AreaTexto rows={3} value={dados.descricao} onChange={e => setDados({ ...dados, descricao: e.target.value })} placeholder="Ex.: dieta, piquete, observações" /></Campo>
      </Janela>
    </section>
  );
};
