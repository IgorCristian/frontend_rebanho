import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, ClipboardList, SlidersHorizontal, Users, Layers, KeyRound, MapPin, Beef, BellRing } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda, Usuario } from '../types';
import { Carregando, Selo } from './ui';
import { FazendaDadosPanel } from './FazendaDadosPanel';
import { ParametrosPanel } from './ParametrosPanel';
import { EquipePanel } from './EquipePanel';
import { LotesPanel } from './LotesPanel';
import { AcessoPanel } from './AcessoPanel';
import { RebanhoArea } from './RebanhoArea';

type Aba = 'rebanho' | 'alertas' | 'dados' | 'parametros' | 'equipe' | 'lotes' | 'acesso';

interface FazendaDetalheProps {
  fazendaId: number;
  usuario: Usuario;
  aoVoltar: () => void;
}

export const FazendaDetalhe: React.FC<FazendaDetalheProps> = ({ fazendaId, usuario, aoVoltar }) => {
  const [fazenda, setFazenda] = useState<Fazenda | null>(null);
  const [aba, setAba] = useState<Aba>('rebanho');

  useEffect(() => {
    api.obterFazenda(fazendaId).then(setFazenda).catch((err) => { toast.error(err.message); aoVoltar(); });
  }, [fazendaId]);

  if (!fazenda) return <Carregando />;

  // Mesmas regras do backend (acesso.py): só o consultor responsável ou o admin configuram;
  // o veterinário vinculado também ajusta os parâmetros.
  const gerencia = usuario.papel === 'admin' || fazenda.consultor.id === usuario.id;
  const editaParametros = gerencia || usuario.papel === 'veterinario';

  const abas: { id: Aba; rotulo: string; icone: React.ReactNode; visivel: boolean }[] = [
    { id: 'rebanho', rotulo: 'Rebanho', icone: <Beef size={18} />, visivel: true },
    { id: 'alertas', rotulo: 'Alertas', icone: <BellRing size={18} />, visivel: true },
    { id: 'dados', rotulo: 'Dados', icone: <ClipboardList size={18} />, visivel: true },
    { id: 'parametros', rotulo: 'Parâmetros', icone: <SlidersHorizontal size={18} />, visivel: true },
    { id: 'equipe', rotulo: 'Equipe', icone: <Users size={18} />, visivel: true },
    { id: 'lotes', rotulo: 'Lotes', icone: <Layers size={18} />, visivel: true },
    { id: 'acesso', rotulo: 'Acesso', icone: <KeyRound size={18} />, visivel: gerencia },
  ];

  return (
    <div className="space-y-4">
      <div>
        <button onClick={aoVoltar} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-3">
          <ArrowLeft size={18} /> Fazendas
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{fazenda.nome}</h1>
          {!fazenda.ativa && <Selo cor="vermelho">Desativada</Selo>}
          {!gerencia && <Selo>{editaParametros ? 'Pode ajustar parâmetros' : 'Somente leitura'}</Selo>}
        </div>
        <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 mt-0.5">
          {(fazenda.cidade || fazenda.uf) && <span className="flex items-center gap-1"><MapPin size={14} />{[fazenda.cidade, fazenda.uf].filter(Boolean).join(' - ')}</span>}
          <span>Consultor: {fazenda.consultor.nome}</span>
        </p>
      </div>

      <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-1 border-b border-gray-200">
        {abas.filter(a => a.visivel).map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[1px] transition ${aba === a.id ? 'border-[#56E39F] text-[#050D21]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {a.icone} {a.rotulo}
          </button>
        ))}
      </nav>

      {(aba === 'rebanho' || aba === 'alertas') && <RebanhoArea fazendaId={fazenda.id} visao={aba} ehGestor={gerencia} />}
      {aba === 'dados' && <FazendaDadosPanel fazenda={fazenda} podeEditar={gerencia} aoSalvar={setFazenda} />}
      {aba === 'parametros' && <ParametrosPanel fazenda={fazenda} podeEditar={editaParametros} aoMudarRaca={(raca) => setFazenda({ ...fazenda, raca_predominante: raca })} />}
      {aba === 'equipe' && <EquipePanel fazendaId={fazenda.id} podeEditar={gerencia} />}
      {aba === 'lotes' && <LotesPanel fazendaId={fazenda.id} podeEditar={gerencia} />}
      {aba === 'acesso' && gerencia && <AcessoPanel fazenda={fazenda} aoMudar={setFazenda} />}
    </div>
  );
};
