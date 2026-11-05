import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Download, Milk, Pencil, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { ResumoSaidaLeite } from '../types';
import { data, hojeISO, numero } from '../services/formato';
import { AJUDA } from '../services/ajuda';
import { Ajuda, AreaTexto, Botao, Campo, Carregando, Cartao, Entrada, Selo, Vazio, confirmar } from './ui';
import { baixarCsv } from './DietasRelatorios';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const nomeDoMes = (mes: string) => `${MESES[Number(mes.slice(5)) - 1]} de ${mes.slice(0, 4)}`;
const mudarMes = (mes: string, passos: number) => {
  const d = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5)) - 1 + passos, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const litros = (v: number) => `${numero(v, v % 1 ? 2 : 0)} L`;
const paraCampo = (v: number) => String(v).replace('.', ',');

// Saída de leite: quanto o caminhão recolheu em cada dia, para conferir com a folha do leite no fim do mês.
export const SaidaLeitePanel: React.FC<{ fazendaId: number; funcionarioId?: number }> = ({ fazendaId, funcionarioId }) => {
  const [dia, setDia] = useState(hojeISO());
  const [mes, setMes] = useState(hojeISO().slice(0, 7));
  const [resumo, setResumo] = useState<ResumoSaidaLeite | null>(null);
  const [qtd, setQtd] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = () => api.saidasLeite(fazendaId, mes, funcionarioId)
    .then(r => { if (r.mes === mes) setResumo(r); })
    .catch((err) => toast.error(err.message));
  useEffect(() => { carregar(); }, [fazendaId, mes, funcionarioId]);

  // O registro do dia escolhido, se ele estiver no mês carregado (o mês acompanha o dia, em escolherDia)
  const carregado = resumo?.mes === dia.slice(0, 7);
  const existente = carregado ? resumo!.registros.find(r => r.data === dia) : undefined;
  const bloqueado = !!existente && !existente.pode_alterar;

  // Dia já registrado abre preenchido, para corrigir; dia novo abre em branco
  useEffect(() => {
    if (!carregado) return;
    setQtd(existente ? paraCampo(existente.litros) : '');
    setObservacao(existente?.observacao || '');
  }, [dia, carregado, existente?.litros, existente?.observacao]);

  const escolherDia = (novo: string) => {
    if (!novo) return;
    setDia(novo);
    setMes(novo.slice(0, 7));
  };

  // Trocar de mês leva o formulário junto (hoje no mês atual; senão, o último dia do mês), para nunca salvar em outro mês sem ver
  const irParaMes = (novo: string) => {
    if (novo === hojeISO().slice(0, 7)) return escolherDia(hojeISO());
    const ultimo = new Date(Number(novo.slice(0, 4)), Number(novo.slice(5)), 0).getDate();
    escolherDia(`${novo}-${String(ultimo).padStart(2, '0')}`);
  };

  const salvar = async () => {
    if (!qtd.trim()) return toast.error('Informe os litros que saíram no dia.');
    setSalvando(true);
    try {
      await api.salvarSaidaLeite(fazendaId, dia, { litros: qtd.trim(), observacao, ...(funcionarioId ? { funcionario_id: funcionarioId } : {}) });
      toast.success(existente ? 'Registro corrigido.' : `Saída de ${data(dia)} registrada.`);
      await carregar();
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (quando: string) => {
    if (!(await confirmar(`Excluir o registro de ${data(quando)}?`, { botao: 'Excluir', perigo: true }))) return;
    try {
      await api.excluirSaidaLeite(fazendaId, quando, funcionarioId);
      toast.success('Registro excluído.');
      await carregar();
    } catch (err: any) {
      toast.error(err.message, { duration: 6000 });
    }
  };

  const exportar = () => {
    if (!resumo) return;
    baixarCsv(`saida-de-leite_${resumo.mes}.csv`, [
      ['Data', 'Litros', 'Observação', 'Registrado por'],
      ...[...resumo.registros].reverse().map(r => [data(r.data), r.litros, r.observacao, r.lancado_por]),
      [],
      ['Total do mês (L)', resumo.total_litros],
      ['Dias com registro', resumo.dias_registrados],
      ['Dias sem registro', resumo.dias_sem_registro.map(data).join(', ')],
    ]);
  };

  return (
    <div className="space-y-4">
      {(!resumo || resumo.pode_lancar) && (
        <Cartao className="p-4 space-y-3">
          <p className="font-semibold text-gray-900 flex items-center gap-2"><Milk size={18} /> {existente ? 'Corrigir o registro do dia' : 'Registrar a saída do dia'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Dia"><Entrada type="date" max={hojeISO()} value={dia} onChange={e => escolherDia(e.target.value)} /></Campo>
            <Campo rotulo="Litros *" ajuda={AJUDA.litrosSaida}>
              <Entrada inputMode="decimal" placeholder="Ex.: 1200" value={qtd} disabled={bloqueado} onChange={e => setQtd(e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Observação" dica="Opcional. Ex.: o caminhão atrasou, leite descartado.">
            <AreaTexto rows={1} value={observacao} disabled={bloqueado} onChange={e => setObservacao(e.target.value)} />
          </Campo>
          {bloqueado ? (
            <p className="text-sm text-gray-500">Este dia já foi registrado por {existente!.lancado_por}. Para mudar, peça ao consultor ou ao veterinário.</p>
          ) : (
            <Botao className="w-full sm:w-auto" onClick={salvar} carregando={salvando} disabled={!carregado}>{existente ? 'Salvar correção' : 'Registrar'}</Botao>
          )}
        </Cartao>
      )}

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => irParaMes(mudarMes(mes, -1))} className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100" aria-label="Mês anterior"><ChevronLeft size={20} /></button>
        <p className="font-bold text-gray-900">{nomeDoMes(mes)}</p>
        <button onClick={() => irParaMes(mudarMes(mes, 1))} disabled={mes >= hojeISO().slice(0, 7)} className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Próximo mês"><ChevronRight size={20} /></button>
      </div>

      {!resumo || resumo.mes !== mes ? <Carregando /> : (
        <>
          <div className="rounded-2xl bg-[#050D21] text-white p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">Total do mês <Ajuda item={AJUDA.totalSaida} escuro /></p>
            <p className="text-3xl font-bold text-[#56E39F] mt-1">{litros(resumo.total_litros)}</p>
            <p className="text-sm text-gray-300 mt-1">
              {resumo.dias_registrados} {resumo.dias_registrados === 1 ? 'dia registrado' : 'dias registrados'}
              {resumo.media_dia != null && ` · média de ${litros(resumo.media_dia)} por dia`}
            </p>
          </div>

          {resumo.dias_sem_registro.length > 0 && (
            <Cartao className="p-4 border-amber-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">
                {resumo.dias_sem_registro.length === 1 ? '1 dia sem registro' : `${resumo.dias_sem_registro.length} dias sem registro`}
              </p>
              <p className="text-xs text-amber-800 mt-0.5 mb-2">O total só bate com a folha se todos os dias com coleta estiverem registrados.</p>
              <div className="flex flex-wrap gap-1.5">
                {resumo.dias_sem_registro.map(d => resumo.pode_lancar ? (
                  <button key={d} onClick={() => escolherDia(d)} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-amber-800 border border-amber-200 hover:border-amber-400">{data(d).slice(0, 5)}</button>
                ) : <Selo key={d} cor="amarelo">{data(d).slice(0, 5)}</Selo>)}
              </div>
            </Cartao>
          )}

          {resumo.registros.length === 0 ? (
            <Cartao><Vazio icone={<Milk />} titulo="Nenhum registro neste mês" /></Cartao>
          ) : (
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-gray-800 ml-1">Registros do mês</h3>
                <Botao variante="secundario" icone={<Download size={16} />} onClick={exportar}>Excel (CSV)</Botao>
              </div>
              <Cartao className="divide-y divide-gray-100">
                {resumo.registros.map(r => (
                  <div key={r.data} className={`p-3 flex items-center gap-3 ${r.data === dia ? 'bg-green-50/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900"><span className="font-semibold">{data(r.data)}</span> · <span className="font-bold">{litros(r.litros)}</span></p>
                      {r.observacao && <p className="text-xs text-gray-500 italic mt-0.5">{r.observacao}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{r.lancado_por && `por ${r.lancado_por}`}{r.corrigido && ' · corrigido'}</p>
                    </div>
                    {r.pode_alterar && (
                      <>
                        <button onClick={() => { escolherDia(r.data); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-gray-400 hover:text-[#050D21] rounded-lg hover:bg-gray-100" title="Corrigir" aria-label={`Corrigir ${data(r.data)}`}><Pencil size={16} /></button>
                        <button onClick={() => excluir(r.data)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Excluir" aria-label={`Excluir ${data(r.data)}`}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                ))}
              </Cartao>
            </section>
          )}
        </>
      )}
    </div>
  );
};
