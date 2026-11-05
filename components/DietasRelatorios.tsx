import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Download, Layers, Package, Pencil, Plus, Salad, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { DietaItem, InsumoGestao, OrigemPreco, RelatorioDietas } from '../types';
import { numero } from '../services/formato';
import { AJUDA, TextoAjuda } from '../services/ajuda';
import { Ajuda, Botao, Campo, Entrada, Selecao, Cartao, Selo, Vazio, Carregando, Janela } from './ui';

export type VisaoCustos = 'dietas' | 'insumos' | 'resumo';

const reais = (v: number | null | undefined, casas = 2) => (v == null ? '—' : `R$ ${numero(v, casas)}`);
const kg = (v: number | null | undefined, casas = 1) => (v == null ? '—' : `${numero(v, casas)} kg`);
const ORIGEM: Record<string, string> = { custo_medio: 'custo médio do estoque', ultimo_preco: 'último preço de compra' };

// Unidades que o backend já converte sozinho (motor/dietas.py); nas outras o consultor diz quantos kg tem 1 unidade
const KG_CONHECIDO: Record<string, number> = { KG: 1, KGS: 1, QUILO: 1, G: 0.001, T: 1000, TN: 1000, TON: 1000, TONELADA: 1000 };
const kgConhecido = (unidade: string | null) => KG_CONHECIDO[(unidade || '').trim().toUpperCase()];

export const baixarCsv = (nome: string, linhas: any[][]) => {
  // Números com vírgula decimal, para o Excel em português
  const celula = (v: any) => `"${typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + linhas.map(l => l.map(celula).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
};

const Th: React.FC<{ children?: React.ReactNode; esquerda?: boolean; ajuda?: TextoAjuda }> = ({ children, esquerda, ajuda }) => (
  <th className={`${esquerda ? 'text-left' : 'text-right'} px-3 py-2`}>{children}{ajuda && <span className="ml-1.5"><Ajuda item={ajuda} /></span>}</th>
);
const Td: React.FC<{ children?: React.ReactNode; esquerda?: boolean; forte?: boolean; className?: string }> = ({ children, esquerda, forte, className = '' }) => (
  <td className={`px-3 py-2 ${esquerda ? '' : 'text-right'} ${forte ? 'font-bold' : ''} ${className}`}>{children}</td>
);
const corSobra = (v: number | null) => (v == null ? '' : v < 0 ? 'text-red-600' : 'text-green-700');

// Relatórios da fase 6: dietas por lote, insumos e preço, resumo do lote.
// Animais e leite vêm do Rebanho; custo dos insumos vem do Gestão Fácil (cliente vinculado).
export const DietasRelatorios: React.FC<{ fazendaId: number; visao: VisaoCustos; gerencia: boolean }> = ({ fazendaId, visao, gerencia }) => {
  const [relatorio, setRelatorio] = useState<RelatorioDietas | null>(null);
  const [editando, setEditando] = useState<{ id: number; nome: string } | null>(null);

  const carregar = () => api.relatorioDietas(fazendaId).then(setRelatorio).catch((err) => toast.error(err.message));
  useEffect(() => { setRelatorio(null); carregar(); }, [fazendaId]);

  if (!relatorio) return <Carregando />;
  const r = relatorio;

  const exportar = () => {
    if (visao === 'dietas') {
      baixarCsv(`dietas-por-lote_${r.data}.csv`, [
        ['Lote', 'Animais', 'Insumo', 'Unidade no Gestão', 'kg/animal/dia', 'kg/dia no lote', 'R$/kg', 'R$/animal/dia', 'R$/dia no lote'],
        ...r.dietas.flatMap(d => d.itens.map(i => [d.lote, d.animais, i.insumo, i.unidade, i.kg_animal_dia, i.kg_dia, i.custo_kg, i.custo_animal_dia, i.custo_dia])),
      ]);
    } else if (visao === 'insumos') {
      baixarCsv(`insumos-e-preco_${r.data}.csv`, [
        ['Insumo', 'Unidade', 'Preço por unidade (R$)', 'Origem do preço', 'R$/kg', 'kg/dia', 'kg/mês', 'R$/dia', 'R$/mês', 'Estoque (kg)', 'Dias de estoque', 'Lotes'],
        ...r.insumos.map(i => [i.insumo, i.unidade, i.preco_unidade, ORIGEM[i.preco_origem || ''] || '', i.custo_kg, i.kg_dia, i.kg_mes, i.custo_dia, i.custo_mes, i.estoque_kg, i.dias_estoque, i.lotes.join(', ')]),
      ]);
    } else {
      baixarCsv(`resumo-do-lote_${r.data}.csv`, [
        ['Lote', 'Animais', 'Vacas em lactação', 'Come (kg/dia)', 'Custa (R$/dia)', 'R$/animal/dia', 'Leite (L/dia)', 'Leite vendável (L/dia)', 'Receita (R$/dia)', 'Sobra (R$/dia)', 'Sobra (R$/mês)', 'Custo da dieta por litro (R$)'],
        ...r.resumo.map(l => [l.lote, l.animais, l.vacas_lactacao, l.kg_dia, l.custo_dia, l.custo_animal_dia, l.leite_dia, l.leite_vendavel_dia, l.receita_dia, l.sobra_dia, l.sobra_mes, l.custo_litro]),
        ['Total', r.totais.animais, r.totais.vacas_lactacao, r.totais.kg_dia, r.totais.custo_dia, '', r.totais.leite_dia, r.totais.leite_vendavel_dia, r.totais.receita_dia, r.totais.sobra_dia, r.totais.sobra_mes, r.totais.custo_litro],
      ]);
    }
  };

  const avisos = r.avisos.length > 0 && (
    <Cartao className="p-3 border-amber-200 bg-amber-50">
      {r.avisos.map(a => <p key={a} className="text-sm text-amber-800 flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /> {a}</p>)}
    </Cartao>
  );

  const cabecalho = (texto: string) => (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500">{texto}</p>
      <Botao variante="secundario" icone={<Download size={16} />} onClick={exportar}>Excel (CSV)</Botao>
    </div>
  );

  // ---------- Dietas por lote ----------
  if (visao === 'dietas') {
    return (
      <div className="space-y-4">
        {cabecalho('Uma linha por lote × insumo com a quantidade por animal por dia; o consumo do lote e o custo são calculados com os animais que estão no lote hoje e o custo do insumo no Gestão.')}
        {avisos}
        {r.dietas.length === 0 ? (
          <Cartao><Vazio icone={<Salad />} titulo="Nenhum lote cadastrado" texto="Cadastre os lotes em Rebanho → Lotes para montar as dietas." /></Cartao>
        ) : r.dietas.map(d => (
          <Cartao key={d.lote_id} className="overflow-hidden">
            <div className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{d.lote} <span className="font-normal text-gray-500">· {d.animais} animal(is)</span></p>
                {d.itens.length > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">{kg(d.kg_animal_dia)}/animal/dia · {reais(d.custo_animal_dia)}/animal/dia · <span className="font-semibold text-gray-800">{reais(d.custo_dia)}/dia no lote</span></p>
                )}
              </div>
              {gerencia && <Botao variante="secundario" icone={<Pencil size={15} />} onClick={() => setEditando({ id: d.lote_id, nome: d.lote })}>{d.itens.length ? 'Editar' : 'Montar dieta'}</Botao>}
            </div>
            {d.itens.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-gray-400">Sem dieta cadastrada.</p>
            ) : (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr><Th esquerda>Insumo</Th><Th>kg/animal/dia</Th><Th>kg/dia no lote</Th><Th>R$/kg</Th><Th>R$/animal/dia</Th><Th>R$/dia no lote</Th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {d.itens.map(i => (
                      <tr key={i.insumo_id}>
                        <Td esquerda forte>{i.insumo}</Td><Td>{numero(i.kg_animal_dia, 2)}</Td><Td>{numero(i.kg_dia, 1)}</Td>
                        <Td><span title={ORIGEM[i.preco_origem || '']}>{reais(i.custo_kg, 4)}</span></Td>
                        <Td>{reais(i.custo_animal_dia)}</Td><Td forte>{reais(i.custo_dia)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Cartao>
        ))}
        {editando && (
          <EditarDietaJanela fazendaId={fazendaId} lote={editando} aoFechar={() => setEditando(null)}
            aoSalvar={() => { setEditando(null); carregar(); }} />
        )}
      </div>
    );
  }

  // ---------- Insumos e preço ----------
  if (visao === 'insumos') {
    return (
      <div className="space-y-4">
        {cabecalho('Insumos usados nas dietas, com o preço do Gestão Fácil (custo médio do estoque; sem estoque, o último preço de compra) e o consumo de todos os lotes.')}
        {avisos}
        {r.insumos.length === 0 ? (
          <Cartao><Vazio icone={<Package />} titulo="Nenhum insumo nas dietas" texto="Monte as dietas dos lotes na aba Dietas por lote." /></Cartao>
        ) : (
          <Cartao className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr><Th esquerda>Insumo</Th><Th ajuda={AJUDA.precoInsumo}>Preço no Gestão</Th><Th>R$/kg</Th><Th>Consumo/dia</Th><Th>Custo/dia</Th><Th>Custo/mês</Th><Th>Estoque</Th><Th ajuda={AJUDA.duraEstoque}>Dura</Th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {r.insumos.map(i => (
                  <tr key={i.insumo_id}>
                    <Td esquerda>
                      <p className="font-semibold">{i.insumo}</p>
                      <p className="text-xs text-gray-400">{i.lotes.join(', ')}</p>
                    </Td>
                    <Td>
                      {i.preco_unidade == null ? '—' : `${reais(i.preco_unidade)}/${i.unidade || 'un'}`}
                      {i.preco_origem && <p className="text-xs text-gray-400">{ORIGEM[i.preco_origem]}</p>}
                    </Td>
                    <Td>{reais(i.custo_kg, 4)}</Td><Td>{kg(i.kg_dia)}</Td><Td forte>{reais(i.custo_dia)}</Td><Td>{reais(i.custo_mes)}</Td>
                    <Td>{kg(i.estoque_kg, 0)}</Td>
                    <Td>{i.dias_estoque == null ? '—' : <Selo cor={i.dias_estoque < 7 ? 'vermelho' : i.dias_estoque < 15 ? 'amarelo' : 'verde'}>{i.dias_estoque} dias</Selo>}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <Td esquerda>Total</Td><Td /><Td /><Td>{kg(r.insumos.reduce((s, i) => s + i.kg_dia, 0))}</Td>
                  <Td>{r.insumos.every(i => i.custo_dia != null) ? reais(r.insumos.reduce((s, i) => s + (i.custo_dia || 0), 0)) : '—'}</Td>
                  <Td>{r.insumos.every(i => i.custo_mes != null) ? reais(r.insumos.reduce((s, i) => s + (i.custo_mes || 0), 0)) : '—'}</Td><Td /><Td />
                </tr>
              </tfoot>
            </table>
          </Cartao>
        )}
      </div>
    );
  }

  // ---------- Resumo do lote ----------
  return (
    <div className="space-y-4">
      {cabecalho(`Quanto cada lote come, custa, produz e quanto sobra de dinheiro por dia (leite vendável × ${r.preco_leite != null ? `${reais(r.preco_leite, 2)}/L` : 'preço do leite'} − custo da dieta). O leite em carência ou no período de colostro não conta como vendável.`)}
      {avisos}
      {r.resumo.length === 0 ? (
        <Cartao><Vazio icone={<Layers />} titulo="Nenhum lote ou animal" /></Cartao>
      ) : (
        <Cartao className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr><Th esquerda>Lote</Th><Th>Animais</Th><Th>Come</Th><Th>Custa</Th><Th ajuda={AJUDA.produzLote}>Produz</Th><Th>Receita</Th><Th ajuda={AJUDA.sobraLote}>Sobra/dia</Th><Th>Sobra/mês</Th><Th ajuda={AJUDA.dietaPorLitro}>Dieta por litro</Th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {r.resumo.map(l => (
                <tr key={l.lote_id ?? 'sem'}>
                  <Td esquerda>
                    <p className="font-semibold">{l.lote}</p>
                    {!l.tem_dieta && <p className="text-xs text-gray-400">sem dieta cadastrada</p>}
                  </Td>
                  <Td>{l.animais}{l.vacas_lactacao > 0 && <p className="text-xs text-gray-400">{l.vacas_lactacao} em lactação</p>}</Td>
                  <Td>{kg(l.kg_dia)}</Td>
                  <Td>{reais(l.custo_dia)}{l.custo_animal_dia != null && <p className="text-xs text-gray-400">{reais(l.custo_animal_dia)}/animal</p>}</Td>
                  <Td>
                    {numero(l.leite_dia, 1)} L
                    {l.leite_vendavel_dia !== l.leite_dia && <p className="text-xs text-gray-400">{numero(l.leite_vendavel_dia, 1)} L vendável</p>}
                  </Td>
                  <Td>{reais(l.receita_dia)}</Td>
                  <Td forte className={corSobra(l.sobra_dia)}>{reais(l.sobra_dia)}</Td>
                  <Td className={corSobra(l.sobra_mes)}>{reais(l.sobra_mes)}</Td>
                  <Td>{reais(l.custo_litro)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <Td esquerda>Total</Td><Td>{r.totais.animais}</Td><Td>{kg(r.totais.kg_dia)}</Td><Td>{reais(r.totais.custo_dia)}</Td>
                <Td>{numero(r.totais.leite_dia, 1)} L</Td><Td>{reais(r.totais.receita_dia)}</Td>
                <Td className={corSobra(r.totais.sobra_dia)}>{reais(r.totais.sobra_dia)}</Td>
                <Td className={corSobra(r.totais.sobra_mes)}>{reais(r.totais.sobra_mes)}</Td><Td>{reais(r.totais.custo_litro)}</Td>
              </tr>
            </tfoot>
          </table>
        </Cartao>
      )}
      <p className="text-xs text-gray-400">Valores de hoje, pelos animais que estão em cada lote e pela média dos últimos controles leiteiros. Mês = 30 dias.</p>
    </div>
  );
};

// ---------- Montar / editar a dieta de um lote (consultor) ----------

type Linha = { gestao_produto_id: string; kg_animal_dia: string; kg_por_unidade: string };
const LINHA_VAZIA: Linha = { gestao_produto_id: '', kg_animal_dia: '', kg_por_unidade: '' };

const EditarDietaJanela: React.FC<{ fazendaId: number; lote: { id: number; nome: string }; aoFechar: () => void; aoSalvar: () => void }> = ({ fazendaId, lote, aoFechar, aoSalvar }) => {
  const [insumos, setInsumos] = useState<InsumoGestao[] | null>(null);
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([api.insumosGestao(fazendaId), api.listarDietas(fazendaId)]).then(([lista, dietas]) => {
      setInsumos(lista);
      const atuais = dietas.filter((i: DietaItem) => i.lote_id === lote.id).map(i => ({
        gestao_produto_id: String(i.gestao_produto_id), kg_animal_dia: String(i.kg_animal_dia).replace('.', ','),
        kg_por_unidade: kgConhecido(i.unidade) ? '' : String(i.kg_por_unidade).replace('.', ','),
      }));
      setLinhas(atuais.length ? atuais : [{ ...LINHA_VAZIA }]);
    }).catch((err) => setErro(err.message));
  }, [fazendaId, lote.id]);

  const mudar = (n: number, campo: keyof Linha, valor: string) => setLinhas(ls => ls!.map((l, i) => (i === n ? { ...l, [campo]: valor } : l)));

  const salvar = async () => {
    setSalvando(true);
    try {
      const itens = linhas!.filter(l => l.gestao_produto_id).map(l => ({
        gestao_produto_id: Number(l.gestao_produto_id), kg_animal_dia: l.kg_animal_dia,
        ...(l.kg_por_unidade ? { kg_por_unidade: l.kg_por_unidade } : {}),
      }));
      await api.salvarDieta(fazendaId, lote.id, itens);
      toast.success('Dieta salva.');
      aoSalvar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const porId = new Map((insumos || []).map(i => [String(i.id), i]));

  return (
    <Janela titulo={`Dieta · ${lote.nome}`} aberta aoFechar={aoFechar}
      rodape={<><Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao><Botao onClick={salvar} carregando={salvando} disabled={!linhas}>Salvar dieta</Botao></>}>
      {erro ? (
        <p className="text-sm text-red-600 flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /> {erro}</p>
      ) : !linhas || !insumos ? <Carregando /> : (
        <>
          <p className="text-sm text-gray-500">Os insumos são os produtos ativos do estoque do cliente vinculado no Gestão Fácil. Informe quanto <b>cada animal</b> do lote come por dia.</p>
          {linhas.map((l, n) => {
            const insumo = porId.get(l.gestao_produto_id);
            const pedeFator = insumo && !kgConhecido(insumo.unidade);
            return (
              <div key={n} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2 items-end">
                  <Campo rotulo="Insumo" className="flex-1 min-w-0">
                    <Selecao value={l.gestao_produto_id} onChange={e => mudar(n, 'gestao_produto_id', e.target.value)}>
                      <option value="">Escolha...</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nome}{i.unidade ? ` (${i.unidade})` : ''}</option>)}
                    </Selecao>
                  </Campo>
                  <button onClick={() => setLinhas(ls => ls!.filter((_, i) => i !== n))} className="p-2.5 text-gray-400 hover:text-red-600" aria-label="Tirar da dieta"><Trash2 size={18} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Campo rotulo="kg/animal/dia"><Entrada inputMode="decimal" value={l.kg_animal_dia} onChange={e => mudar(n, 'kg_animal_dia', e.target.value)} /></Campo>
                  {pedeFator && (
                    <Campo rotulo={`kg em 1 ${insumo!.unidade || 'unidade'}`} dica="Ex.: saco de 40 kg = 40" ajuda={AJUDA.kgPorUnidade}>
                      <Entrada inputMode="decimal" value={l.kg_por_unidade} onChange={e => mudar(n, 'kg_por_unidade', e.target.value)} />
                    </Campo>
                  )}
                </div>
              </div>
            );
          })}
          <Botao variante="secundario" icone={<Plus size={16} />} onClick={() => setLinhas(ls => [...ls!, { ...LINHA_VAZIA }])}>Adicionar insumo</Botao>
        </>
      )}
    </Janela>
  );
};
