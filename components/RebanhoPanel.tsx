import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Beef, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { AnimalResumo, CATEGORIAS, Lote } from '../types';
import { idade, numero, COR_PRIORIDADE } from '../services/formato';
import { Botao, Entrada, Cartao, Selo, Vazio, Carregando } from './ui';
import { NovoAnimalJanela } from './NovoAnimalJanela';

interface Props {
  fazendaId: number;
  podeCadastrar: boolean;
  lotes: Lote[];
  aoAbrirAnimal: (animalId: number) => void;
}

const ORDEM_CATEGORIAS = ['LAC', 'RPA', 'SEC', 'PRE', 'NVP', 'NVA', 'REC', 'BZF', 'BZM', 'GAR', 'TOR'];

export const RebanhoPanel: React.FC<Props> = ({ fazendaId, podeCadastrar, lotes, aoAbrirAnimal }) => {
  const [status, setStatus] = useState<'ativo' | 'baixado'>('ativo');
  const [animais, setAnimais] = useState<AnimalResumo[] | null>(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);

  useEffect(() => {
    setAnimais(null);
    api.listarAnimais(fazendaId, status).then(setAnimais).catch((err) => { toast.error(err.message); setAnimais([]); });
  }, [fazendaId, status]);

  const contagem = useMemo(() => {
    const mapa: Record<string, number> = {};
    (animais || []).forEach(a => { if (a.categoria) mapa[a.categoria] = (mapa[a.categoria] || 0) + 1; });
    return mapa;
  }, [animais]);

  const termo = busca.trim().toLowerCase();
  const filtrados = (animais || []).filter(a =>
    (!categoria || a.categoria === categoria) &&
    (!termo || a.brinco.toLowerCase().includes(termo) || a.nome?.toLowerCase().includes(termo)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Entrada className="pl-10" placeholder="Buscar pelo brinco ou nome" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        {podeCadastrar && <Botao icone={<Plus size={18} />} onClick={() => setCadastrando(true)}><span className="hidden sm:inline">Novo animal</span></Botao>}
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <Filtro ativo={!categoria} onClick={() => setCategoria(null)}>Todos {animais ? `(${animais.length})` : ''}</Filtro>
        {ORDEM_CATEGORIAS.filter(c => contagem[c]).map(c => (
          <Filtro key={c} ativo={categoria === c} onClick={() => setCategoria(categoria === c ? null : c)}>{CATEGORIAS[c]} ({contagem[c]})</Filtro>
        ))}
        <span className="flex-1" />
        <Filtro ativo={status === 'baixado'} onClick={() => { setStatus(status === 'ativo' ? 'baixado' : 'ativo'); setCategoria(null); }}>
          {status === 'ativo' ? 'Ver baixados' : 'Ver ativos'}
        </Filtro>
      </div>

      {animais === null ? <Carregando /> : filtrados.length === 0 ? (
        <Cartao>
          <Vazio icone={<Beef />}
            titulo={termo || categoria ? 'Nenhum animal encontrado' : status === 'baixado' ? 'Nenhum animal baixado' : 'Nenhum animal cadastrado'}
            texto={!termo && !categoria && status === 'ativo' && podeCadastrar ? 'Cadastre os animais da fazenda para começar a acompanhar o rebanho.' : undefined}
            acao={!termo && !categoria && status === 'ativo' && podeCadastrar ? <Botao icone={<Plus size={18} />} onClick={() => setCadastrando(true)}>Novo animal</Botao> : undefined} />
        </Cartao>
      ) : (
        <Cartao className="divide-y divide-gray-100">
          {filtrados.map(a => {
            const urgente = a.alertas.find(x => x.prioridade === 'alta') || a.alertas[0];
            return (
              <button key={a.id} onClick={() => aoAbrirAnimal(a.id)} className="w-full p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition">
                <div className={`w-12 h-12 shrink-0 rounded-xl flex flex-col items-center justify-center font-bold ${a.sexo === 'F' ? 'bg-[#050D21] text-[#56E39F]' : 'bg-blue-50 text-blue-700'}`}>
                  <span className="text-sm leading-none truncate max-w-[44px]">{a.brinco}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                    {a.nome || `Brinco ${a.brinco}`}
                    {a.categoria && <Selo cor={a.categoria === 'BAI' ? 'vermelho' : 'cinza'}>{CATEGORIAS[a.categoria]}</Selo>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {[idade(a.idade_meses), a.del != null && `DEL ${numero(a.del)}`, a.lote?.nome].filter(Boolean).join(' · ')}
                  </p>
                  {urgente && (
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${COR_PRIORIDADE[urgente.prioridade]}`}>
                      <AlertTriangle size={11} /> {urgente.titulo}{a.alertas.length > 1 ? ` +${a.alertas.length - 1}` : ''}
                    </span>
                  )}
                </div>
                <ChevronRight className="text-gray-300 shrink-0" size={20} />
              </button>
            );
          })}
        </Cartao>
      )}

      <NovoAnimalJanela aberta={cadastrando} fazendaId={fazendaId} lotes={lotes} aoFechar={() => setCadastrando(false)}
        aoCriar={(id) => { setCadastrando(false); toast.success('Animal cadastrado!'); aoAbrirAnimal(id); }} />
    </div>
  );
};

const Filtro: React.FC<{ ativo: boolean; onClick: () => void; children: React.ReactNode }> = ({ ativo, onClick, children }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${ativo ? 'bg-[#050D21] text-white border-[#050D21]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
    {children}
  </button>
);
