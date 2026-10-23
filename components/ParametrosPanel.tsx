import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, RotateCcw, Save, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda, Parametro, RACAS } from '../types';
import { Botao, Cartao, Selo, Selecao, Carregando } from './ui';

interface Props {
  fazenda: Fazenda;
  podeEditar: boolean;
  aoMudarRaca: (raca: string) => void;
}

// Percentuais (P06) chegam como fração (0.55) e aparecem como 55 na tela
const ehPercentual = (p: Parametro) => p.unidade === '%';
const paraTela = (p: Parametro, valor: number | string) =>
  ehPercentual(p) && typeof valor === 'number' ? String(Math.round(valor * 10000) / 100) : String(valor);
const paraApi = (p: Parametro, texto: string): number | string => {
  if (p.tipo === 'texto') return texto;
  const numero = Number(texto.replace(',', '.'));
  return ehPercentual(p) ? numero / 100 : numero;
};

export const ParametrosPanel: React.FC<Props> = ({ fazenda, podeEditar, aoMudarRaca }) => {
  const [parametros, setParametros] = useState<Parametro[] | null>(null);
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [raca, setRaca] = useState('');

  const receber = (lista: Parametro[]) => {
    setParametros(lista);
    setEdicoes({});
  };

  useEffect(() => {
    api.listarParametros(fazenda.id).then(receber).catch((err) => toast.error(err.message));
  }, [fazenda.id]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Parametro[]>();
    (parametros || []).forEach(p => mapa.set(p.grupo, [...(mapa.get(p.grupo) || []), p]));
    return [...mapa.entries()];
  }, [parametros]);

  if (!parametros) return <Carregando />;

  const alterados = Object.entries(edicoes).filter(([codigo, texto]) => {
    const p = parametros.find(x => x.codigo === codigo)!;
    return texto.trim() !== paraTela(p, p.valor);
  });

  const salvar = async (valores: Record<string, number | string | null>) => {
    setSalvando(true);
    try {
      receber(await api.salvarParametros(fazenda.id, valores));
      toast.success('Parâmetros salvos.');
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  const salvarAlterados = () => {
    const valores: Record<string, number | string> = {};
    for (const [codigo, texto] of alterados) {
      const p = parametros.find(x => x.codigo === codigo)!;
      if (!texto.trim()) return toast.error(`${codigo}: informe um valor.`);
      if (p.tipo === 'numero') {
        const numero = Number(texto.replace(',', '.'));
        if (isNaN(numero)) return toast.error(`${codigo}: valor numérico inválido.`);
        if (p.inteiro && !Number.isInteger(numero)) return toast.error(`${codigo}: use um número inteiro.`);
        if ((p.minimo != null && numero < p.minimo) || (p.maximo != null && numero > p.maximo)) {
          return toast.error(`${codigo}: use um valor entre ${p.minimo} e ${p.maximo}.`);
        }
      }
      valores[codigo] = paraApi(p, texto.trim());
    }
    salvar(valores);
  };

  const voltarPadrao = (p: Parametro) => salvar({ [p.codigo]: null });

  const aplicarRaca = async () => {
    if (!raca) return;
    if (!confirm(`Aplicar os valores de referência da raça ${raca}? Peso adulto, idade de 1ª cobertura e gestação podem mudar.`)) return;
    setSalvando(true);
    try {
      receber(await api.aplicarRaca(fazenda.id, raca));
      aoMudarRaca(raca);
      setRaca('');
      toast.success(`Parâmetros ajustados para ${raca}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <Cartao className="p-4 text-sm text-gray-600">
        Prazos e metas que o sistema usa para calcular categorias, previsões e alertas. Os valores padrão vêm da planilha;
        revise com o produtor e o veterinário. Os parâmetros com <Lock size={13} className="inline -mt-0.5" /> são biológicos e não mudam.
      </Cartao>

      {podeEditar && (
        <Cartao className="p-4">
          <p className="font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-[#4CD090]" /> Pré-preencher pela raça</p>
          <p className="text-sm text-gray-500 mt-0.5 mb-3">
            Usa o meio das faixas de referência da planilha. Raça atual: <strong>{fazenda.raca_predominante || 'não definida'}</strong>.
          </p>
          <div className="flex gap-2">
            <Selecao value={raca} onChange={e => setRaca(e.target.value)} className="flex-1">
              <option value="">Escolha a raça...</option>{RACAS.map(r => <option key={r}>{r}</option>)}
            </Selecao>
            <Botao variante="escuro" onClick={aplicarRaca} disabled={!raca} carregando={salvando}>Aplicar</Botao>
          </div>
        </Cartao>
      )}

      {grupos.map(([grupo, lista]) => (
        <section key={grupo}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{grupo}</h3>
          <Cartao className="divide-y divide-gray-100">
            {lista.map(p => {
              const texto = edicoes[p.codigo] ?? paraTela(p, p.valor);
              const editando = edicoes[p.codigo] !== undefined && texto.trim() !== paraTela(p, p.valor);
              const bloqueado = !podeEditar || !p.ajustavel;
              return (
                <div key={p.codigo} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${editando ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
                      <span className="text-gray-400 font-mono text-xs">{p.codigo}</span> {p.nome}
                      {!p.ajustavel && <Lock size={13} className="text-gray-400" />}
                      {p.alterado && <Selo cor="azul">Ajustado</Selo>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Referência: {p.faixa} · Padrão: {paraTela(p, p.padrao)} {p.tipo === 'numero' ? p.unidade : ''}
                      {p.minimo != null && p.maximo != null && ` · Aceita de ${p.minimo} a ${p.maximo}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:w-56">
                    {p.opcoes ? (
                      <select disabled={bloqueado} value={texto} onChange={e => setEdicoes({ ...edicoes, [p.codigo]: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#56E39F]">
                        {p.opcoes.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="flex-1 flex items-center border border-gray-200 rounded-lg bg-white focus-within:border-[#56E39F] has-[:disabled]:bg-gray-50">
                        <input disabled={bloqueado} value={texto} inputMode={p.tipo === 'texto' ? 'text' : p.inteiro ? 'numeric' : 'decimal'}
                          onChange={e => setEdicoes({ ...edicoes, [p.codigo]: e.target.value })}
                          className="w-full min-w-0 px-3 py-2 bg-transparent rounded-lg text-right focus:outline-none disabled:text-gray-500" />
                        {p.tipo === 'numero' && <span className="pr-3 text-xs text-gray-400 whitespace-nowrap">{p.unidade}</span>}
                      </div>
                    )}
                    {podeEditar && p.ajustavel && p.alterado && !editando && (
                      <button onClick={() => voltarPadrao(p)} disabled={salvando} title="Voltar ao padrão"
                        className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><RotateCcw size={16} /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </Cartao>
        </section>
      ))}

      {podeEditar && alterados.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-72 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">{alterados.length} parâmetro(s) alterado(s)</span>
            <div className="flex gap-2">
              <Botao variante="secundario" onClick={() => setEdicoes({})}>Descartar</Botao>
              <Botao icone={<Save size={18} />} onClick={salvarAlterados} carregando={salvando}>Salvar</Botao>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
