import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { AlertaDoDia, CATEGORIAS, Prioridade } from '../types';
import { COR_PRIORIDADE, NOME_PRIORIDADE } from '../services/formato';
import { Cartao, Vazio, Carregando } from './ui';

interface Props {
  fazendaId: number;
  aoAbrirAnimal: (animalId: number) => void;
}

// Alertas do dia: o que precisa ser feito no rebanho hoje, do mais urgente para o menos urgente
export const AlertasPanel: React.FC<Props> = ({ fazendaId, aoAbrirAnimal }) => {
  const [alertas, setAlertas] = useState<AlertaDoDia[] | null>(null);
  const [filtro, setFiltro] = useState<string | null>(null);

  useEffect(() => {
    api.alertasDoDia(fazendaId).then(setAlertas).catch((err) => { toast.error(err.message); setAlertas([]); });
  }, [fazendaId]);

  // Agrupa por tipo de alerta (ex.: "Fazer diagnóstico: 5 animais")
  const grupos = useMemo(() => {
    const mapa = new Map<string, { titulo: string; prioridade: Prioridade; itens: AlertaDoDia[] }>();
    (alertas || []).forEach(a => {
      // Agrupa pelo título: cada vacina pendente fica no seu próprio grupo
      const g = mapa.get(a.titulo) || { titulo: a.titulo, prioridade: a.prioridade, itens: [] };
      g.itens.push(a);
      mapa.set(a.titulo, g);
    });
    return [...mapa.entries()];
  }, [alertas]);

  if (alertas === null) return <Carregando />;
  if (alertas.length === 0) {
    return <Cartao><Vazio icone={<CheckCircle2 />} titulo="Nenhum alerta hoje" texto="Tudo em dia com o manejo do rebanho." /></Cartao>;
  }

  const visiveis = filtro ? grupos.filter(([c]) => c === filtro) : grupos;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        <button onClick={() => setFiltro(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${!filtro ? 'bg-[#050D21] text-white border-[#050D21]' : 'bg-white text-gray-600 border-gray-200'}`}>
          Todos ({alertas.length})
        </button>
        {grupos.map(([codigo, g]) => (
          <button key={codigo} onClick={() => setFiltro(filtro === codigo ? null : codigo)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${filtro === codigo ? 'bg-[#050D21] text-white border-[#050D21]' : COR_PRIORIDADE[g.prioridade]}`}>
            {g.titulo} ({g.itens.length})
          </button>
        ))}
      </div>

      {visiveis.map(([codigo, g]) => (
        <section key={codigo}>
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2 ml-1">
            <BellRing size={16} className={g.prioridade === 'alta' ? 'text-red-500' : g.prioridade === 'media' ? 'text-amber-500' : 'text-gray-400'} />
            {g.titulo}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${COR_PRIORIDADE[g.prioridade]}`}>{NOME_PRIORIDADE[g.prioridade]}</span>
          </h3>
          <Cartao className="divide-y divide-gray-100">
            {g.itens.map((a, i) => (
              <button key={`${codigo}-${a.animal.id}-${i}`} onClick={() => aoAbrirAnimal(a.animal.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm flex items-center justify-center">{a.animal.brinco}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {a.animal.nome || `Brinco ${a.animal.brinco}`} <span className="text-gray-400 font-normal">· {CATEGORIAS[a.animal.categoria]}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.mensagem}</p>
                </div>
                <ChevronRight className="text-gray-300 shrink-0" size={18} />
              </button>
            ))}
          </Cartao>
        </section>
      ))}
    </div>
  );
};
