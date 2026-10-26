import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Target } from 'lucide-react';
import { api } from '../services/api';
import { Indicador } from '../types';
import { valorIndicador, COR_SITUACAO, NOME_SITUACAO } from '../services/formato';
import { Cartao, Carregando } from './ui';

// Indicadores do rebanho (aba INDICADORES da planilha) comparados com a meta da fazenda
export const IndicadoresPanel: React.FC<{ fazendaId: number }> = ({ fazendaId }) => {
  const [indicadores, setIndicadores] = useState<Indicador[] | null>(null);

  useEffect(() => {
    api.indicadores(fazendaId).then(r => setIndicadores(r.indicadores)).catch((err) => { toast.error(err.message); setIndicadores([]); });
  }, [fazendaId]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Indicador[]>();
    (indicadores || []).forEach(i => mapa.set(i.grupo, [...(mapa.get(i.grupo) || []), i]));
    return [...mapa.entries()];
  }, [indicadores]);

  if (!indicadores) return <Carregando texto="Calculando indicadores..." />;

  const contagem = (s: Indicador['situacao']) => indicadores.filter(i => i.situacao === s).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {(['bom', 'atencao', 'ruim'] as const).map(s => (
          <div key={s} className={`rounded-xl border p-3 text-center ${COR_SITUACAO[s]}`}>
            <p className="text-2xl font-bold">{contagem(s)}</p>
            <p className="text-[11px] font-semibold">{NOME_SITUACAO[s]}</p>
          </div>
        ))}
      </div>

      {grupos.map(([grupo, lista]) => (
        <section key={grupo}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{grupo}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {lista.map(i => (
              <Cartao key={i.codigo} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{i.nome}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${COR_SITUACAO[i.situacao]}`}>{NOME_SITUACAO[i.situacao]}</span>
                </div>
                <p className="text-2xl font-bold text-[#050D21] mt-2">{valorIndicador(i.valor, i.unidade)}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Target size={12} /> Meta: {valorIndicador(i.meta, i.unidade)}
                  {i.sentido === 'menor' ? ' ou menos' : i.sentido === 'maior' ? ' ou mais' : ' (perto)'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">{i.como} · {i.base}</p>
              </Cartao>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-gray-400">As metas de cada indicador podem ser ajustadas em Configurações → Metas.</p>
    </div>
  );
};
