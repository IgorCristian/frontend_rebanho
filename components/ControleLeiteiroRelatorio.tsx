import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Milk } from 'lucide-react';
import { api } from '../services/api';
import { RelatorioControleLeiteiro } from '../types';
import { data, numero, hojeISO } from '../services/formato';
import { Botao, Campo, Entrada, Cartao, Vazio, Carregando } from './ui';

const diasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const litros = (v: number | null) => (v == null ? '—' : numero(v, 1));

// Relatório de controle leiteiro: cada linha é um controle (ordenhas e soma do dia);
// o resumo mostra a média diária de cada animal no período escolhido.
export const ControleLeiteiroRelatorio: React.FC<{ fazendaId: number }> = ({ fazendaId }) => {
  const [inicio, setInicio] = useState(diasAtras(30));
  const [fim, setFim] = useState(hojeISO());
  const [relatorio, setRelatorio] = useState<RelatorioControleLeiteiro | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      setRelatorio(await api.relatorioControleLeiteiro(fazendaId, inicio, fim));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, [fazendaId]);

  const exportarCsv = () => {
    if (!relatorio) return;
    // Números com vírgula decimal, para o Excel em português
    const celula = (v: any) => `"${typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '').replace(/"/g, '""')}"`;
    const linhas = [
      ['Data', 'ID animal', 'Nome', 'Ordenha 1 (L)', 'Ordenha 2 (L)', 'Ordenha 3 (L)', 'Total do dia (L)'],
      ...relatorio.linhas.map(l => [data(l.data), l.brinco, l.nome, l.ordenha_1, l.ordenha_2, l.ordenha_3, l.total_dia]),
      [],
      ['Resumo do período', `${data(relatorio.inicio)} a ${data(relatorio.fim)}`],
      ['ID animal', 'Nome', 'Controles', 'Média diária (L)', 'Maior (L)', 'Menor (L)'],
      ...relatorio.resumo_por_animal.map(r => [r.brinco, r.nome, r.controles, r.media_diaria, r.maior, r.menor]),
    ];
    const csv = '﻿' + linhas.map(l => l.map(celula).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-leiteiro_${relatorio.inicio}_a_${relatorio.fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Cartao className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <Campo rotulo="De"><Entrada type="date" max={fim} value={inicio} onChange={e => setInicio(e.target.value)} /></Campo>
          <Campo rotulo="Até"><Entrada type="date" min={inicio} max={hojeISO()} value={fim} onChange={e => setFim(e.target.value)} /></Campo>
          <Botao variante="escuro" onClick={carregar} carregando={carregando}>Filtrar</Botao>
          <Botao variante="secundario" icone={<Download size={16} />} onClick={exportarCsv} disabled={!relatorio?.linhas.length}>Excel (CSV)</Botao>
        </div>
      </Cartao>

      {!relatorio ? <Carregando /> : relatorio.linhas.length === 0 ? (
        <Cartao><Vazio icone={<Milk />} titulo="Nenhum controle leiteiro no período" texto="Lance o controle leiteiro na ficha das vacas em lactação." /></Cartao>
      ) : (
        <>
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2 ml-1">
              Média diária por animal <span className="font-normal text-gray-500">· {data(relatorio.inicio)} a {data(relatorio.fim)} · média geral {litros(relatorio.media_geral)} L</span>
            </h3>
            <Cartao className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th><th className="text-left px-3 py-2">Nome</th>
                    <th className="text-right px-3 py-2">Controles</th><th className="text-right px-3 py-2">Média diária</th>
                    <th className="text-right px-3 py-2">Maior</th><th className="text-right px-3 py-2">Menor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {relatorio.resumo_por_animal.map(r => (
                    <tr key={r.animal_id}>
                      <td className="px-3 py-2 font-semibold">{r.brinco}</td><td className="px-3 py-2">{r.nome || '—'}</td>
                      <td className="px-3 py-2 text-right">{r.controles}</td>
                      <td className="px-3 py-2 text-right font-bold">{litros(r.media_diaria)} L</td>
                      <td className="px-3 py-2 text-right">{litros(r.maior)}</td><td className="px-3 py-2 text-right">{litros(r.menor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Cartao>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2 ml-1">Controles do período <span className="font-normal text-gray-500">· {relatorio.linhas.length}</span></h3>
            <Cartao className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Data</th><th className="text-left px-3 py-2">ID</th><th className="text-left px-3 py-2">Nome</th>
                    <th className="text-right px-3 py-2">Ord. 1</th><th className="text-right px-3 py-2">Ord. 2</th><th className="text-right px-3 py-2">Ord. 3</th>
                    <th className="text-right px-3 py-2">Total do dia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {relatorio.linhas.map((l, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{data(l.data)}</td><td className="px-3 py-2 font-semibold">{l.brinco}</td><td className="px-3 py-2">{l.nome || '—'}</td>
                      <td className="px-3 py-2 text-right">{litros(l.ordenha_1)}</td><td className="px-3 py-2 text-right">{litros(l.ordenha_2)}</td>
                      <td className="px-3 py-2 text-right">{litros(l.ordenha_3)}</td><td className="px-3 py-2 text-right font-bold">{litros(l.total_dia)} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Cartao>
          </section>
        </>
      )}
    </div>
  );
};
