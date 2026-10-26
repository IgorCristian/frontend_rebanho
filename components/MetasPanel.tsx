import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RotateCcw, Save } from 'lucide-react';
import { api } from '../services/api';
import { MetaIndicador } from '../types';
import { Botao, Cartao, Selo, Carregando, TituloSecao } from './ui';

interface Props {
  fazendaId: number;
  podeEditar: boolean;
}

// Percentuais chegam como fração (0.6) e aparecem como 60
const paraTela = (m: MetaIndicador, v: number) => (m.unidade === '%' ? String(Math.round(v * 10000) / 100) : String(v));
const paraApi = (m: MetaIndicador, texto: string) => {
  const n = Number(texto.replace(',', '.'));
  return m.unidade === '%' ? n / 100 : n;
};

export const MetasPanel: React.FC<Props> = ({ fazendaId, podeEditar }) => {
  const [metas, setMetas] = useState<MetaIndicador[] | null>(null);
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { api.listarMetas(fazendaId).then(setMetas).catch((err) => toast.error(err.message)); }, [fazendaId]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, MetaIndicador[]>();
    (metas || []).forEach(m => mapa.set(m.grupo, [...(mapa.get(m.grupo) || []), m]));
    return [...mapa.entries()];
  }, [metas]);

  if (!metas) return <Carregando />;

  const alteradas = Object.entries(edicoes).filter(([codigo, texto]) => {
    const m = metas.find(x => x.codigo === codigo)!;
    return texto.trim() !== paraTela(m, m.meta);
  });

  const salvar = async (valores: Record<string, number | null>) => {
    setSalvando(true);
    try {
      setMetas(await api.salvarMetas(fazendaId, valores));
      setEdicoes({});
      toast.success('Metas salvas.');
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  const salvarAlteradas = () => {
    const valores: Record<string, number> = {};
    for (const [codigo, texto] of alteradas) {
      const m = metas.find(x => x.codigo === codigo)!;
      const n = paraApi(m, texto.trim());
      if (!texto.trim() || isNaN(n) || n <= 0) return toast.error(`${m.nome}: informe um número maior que zero.`);
      valores[codigo] = n;
    }
    salvar(valores);
  };

  return (
    <section className="space-y-4">
      <TituloSecao titulo="Metas dos indicadores" descricao="Valores de referência da planilha. Ajuste conforme a realidade e o objetivo da fazenda." />
      {grupos.map(([grupo, lista]) => (
        <div key={grupo}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{grupo}</h3>
          <Cartao className="divide-y divide-gray-100">
            {lista.map(m => (
              <div key={m.codigo} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
                    {m.nome} {m.alterada && <Selo cor="azul">Ajustada</Selo>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.sentido === 'menor' ? 'Quanto menor, melhor' : m.sentido === 'maior' ? 'Quanto maior, melhor' : 'Bom perto da meta'} · Padrão: {paraTela(m, m.padrao)} {m.unidade}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:w-48">
                  <div className="flex-1 flex items-center border border-gray-200 rounded-lg bg-white focus-within:border-[#56E39F] has-[:disabled]:bg-gray-50">
                    <input disabled={!podeEditar} inputMode="decimal" value={edicoes[m.codigo] ?? paraTela(m, m.meta)}
                      onChange={e => setEdicoes({ ...edicoes, [m.codigo]: e.target.value })}
                      className="w-full min-w-0 px-3 py-2 bg-transparent rounded-lg text-right focus:outline-none disabled:text-gray-500" />
                    <span className="pr-3 text-xs text-gray-400 whitespace-nowrap">{m.unidade}</span>
                  </div>
                  {podeEditar && m.alterada && edicoes[m.codigo] === undefined && (
                    <button onClick={() => salvar({ [m.codigo]: null })} title="Voltar ao padrão" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><RotateCcw size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </Cartao>
        </div>
      ))}
      {podeEditar && alteradas.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-72 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">{alteradas.length} meta(s) alterada(s)</span>
            <div className="flex gap-2">
              <Botao variante="secundario" onClick={() => setEdicoes({})}>Descartar</Botao>
              <Botao icone={<Save size={18} />} onClick={salvarAlteradas} carregando={salvando}>Salvar</Botao>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
