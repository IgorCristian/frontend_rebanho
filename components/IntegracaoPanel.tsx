import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link2, RefreshCw, AlertTriangle, CheckCircle2, Package, PlugZap } from 'lucide-react';
import { api } from '../services/api';
import { ClienteGestao, Fazenda, InsumoGestao, IntegracaoStatus } from '../types';
import { data, numero } from '../services/formato';
import { Botao, Campo, Selecao, Entrada, Cartao, Selo, Carregando, TituloSecao } from './ui';

interface Props {
  fazenda: Fazenda;
  aoMudar: (f: Fazenda) => void;
}

// Integração com o Gestão Fácil: vínculo da fazenda com o cliente, envios de venda/compra e insumos
export const IntegracaoPanel: React.FC<Props> = ({ fazenda, aoMudar }) => {
  const [status, setStatus] = useState<IntegracaoStatus | null>(null);
  const [clientes, setClientes] = useState<ClienteGestao[] | null>(null);
  const [escolhido, setEscolhido] = useState('');
  const [insumos, setInsumos] = useState<InsumoGestao[] | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = () => api.integracao(fazenda.id).then(s => {
    setStatus(s);
    setEscolhido(s.gestao_cliente_id ? String(s.gestao_cliente_id) : '');
    if (s.configurada) api.clientesGestao().then(setClientes).catch(() => setClientes([]));
  }).catch((err) => toast.error(err.message));

  useEffect(() => { carregar(); }, [fazenda.id]);

  if (!status) return <Carregando />;

  const salvarVinculo = async () => {
    setOcupado(true);
    try {
      aoMudar(await api.editarFazenda(fazenda.id, { gestao_cliente_id: escolhido ? Number(escolhido) : null }));
      toast.success(escolhido ? 'Fazenda vinculada. Vendas e compras já lançadas foram enviadas.' : 'Vínculo removido.');
      setInsumos(null);
      await carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const sincronizar = async () => {
    setOcupado(true);
    try {
      const r = await api.sincronizarGestao(fazenda.id);
      setStatus(r);
      if (r.falhas) toast.error(`${r.enviados || 0} enviado(s), ${r.falhas} com problema.`);
      else toast.success(r.enviados ? `${r.enviados} lançamento(s) enviado(s) ao Gestão.` : 'Tudo já estava em dia.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const verInsumos = async () => {
    setOcupado(true);
    try {
      setInsumos(await api.insumosGestao(fazenda.id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const enviados = status.resumo.enviado || 0;

  return (
    <div className="space-y-4">
      <TituloSecao titulo="Integração com o Gestão Fácil"
        descricao="Vendas e compras de animais com valor entram no financeiro do Gestão como pendentes, no plano de contas do leite (aparecem no DRE Leite)." />

      {!status.configurada ? (
        <Cartao className="p-4 flex items-start gap-3">
          <PlugZap className="text-gray-400 shrink-0" size={22} />
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Integração desligada no servidor</p>
            <p className="mt-0.5">Falta configurar o endereço e o token do Gestão no servidor do Rebanho. Os lançamentos ficam guardados e são enviados assim que for ligada.</p>
          </div>
        </Cartao>
      ) : (
        <Cartao className="p-4 space-y-3">
          <p className="font-semibold text-gray-900 flex items-center gap-2"><Link2 size={18} /> Cliente vinculado no Gestão</p>
          {status.cliente ? (
            <p className="text-sm text-gray-600 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-600" /> {status.cliente.nome} <span className="text-gray-400">(ID {status.cliente.id})</span></p>
          ) : status.erro_cliente ? (
            <p className="text-sm text-red-600 flex items-center gap-2"><AlertTriangle size={16} /> {status.erro_cliente}</p>
          ) : (
            <p className="text-sm text-gray-500">Nenhum cliente vinculado.</p>
          )}
          <div className="flex gap-2 items-end">
            <Campo rotulo="Cliente" className="flex-1">
              {clientes && clientes.length > 0 ? (
                <Selecao value={escolhido} onChange={e => setEscolhido(e.target.value)}>
                  <option value="">Sem vínculo</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} (ID {c.id})</option>)}
                </Selecao>
              ) : (
                <Entrada inputMode="numeric" placeholder="ID do cliente no Gestão" value={escolhido} onChange={e => setEscolhido(e.target.value.replace(/\D/g, ''))} />
              )}
            </Campo>
            <Botao onClick={salvarVinculo} carregando={ocupado} disabled={escolhido === (status.gestao_cliente_id ? String(status.gestao_cliente_id) : '')}>Salvar</Botao>
          </div>
        </Cartao>
      )}

      <Cartao className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">Lançamentos enviados</p>
            <p className="text-sm text-gray-500 mt-0.5">{enviados} no financeiro · {status.pendencias.length} aguardando</p>
          </div>
          <Botao variante="escuro" icone={<RefreshCw size={16} />} onClick={sincronizar} carregando={ocupado}>Sincronizar agora</Botao>
        </div>
        {status.pendencias.length > 0 && (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
            {status.pendencias.map(p => (
              <div key={p.evento_id} className="p-3 text-sm flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {p.acao === 'remover' ? 'Remover ' : ''}{p.tipo_nome} · {p.animal.brinco}{p.animal.nome ? ` (${p.animal.nome})` : ''}
                    {p.valor != null && <span className="font-normal text-gray-500"> · R$ {numero(Number(p.valor), 2)}</span>}
                  </p>
                  <p className="text-xs text-gray-500">{data(p.data)}{p.erro ? ` · ${p.erro}` : ''}</p>
                </div>
                <Selo cor={p.status === 'erro' ? 'vermelho' : 'amarelo'}>{p.status === 'erro' ? 'Erro' : 'Aguardando'}</Selo>
              </div>
            ))}
          </div>
        )}
      </Cartao>

      {status.configurada && status.cliente && (
        <Cartao className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2"><Package size={18} /> Insumos no Gestão</p>
              <p className="text-sm text-gray-500 mt-0.5">Estoque e custo médio do cliente vinculado. Serão usados nas dietas (fase 6).</p>
            </div>
            <Botao variante="secundario" onClick={verInsumos} carregando={ocupado}>{insumos ? 'Atualizar' : 'Ver insumos'}</Botao>
          </div>
          {insumos && (insumos.length === 0 ? <p className="text-sm text-gray-500">Nenhum produto ativo no estoque do cliente.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr><th className="text-left px-3 py-2">Insumo</th><th className="text-right px-3 py-2">Estoque</th>
                    <th className="text-right px-3 py-2">Custo médio</th><th className="text-right px-3 py-2">Última compra</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insumos.map(i => (
                    <tr key={i.id}>
                      <td className="px-3 py-2"><span className="font-medium">{i.nome}</span>{i.categoria && <span className="text-xs text-gray-400"> · {i.categoria}</span>}</td>
                      <td className="px-3 py-2 text-right">{numero(i.quantidade_atual, 1)} {i.unidade || ''}</td>
                      <td className="px-3 py-2 text-right">{i.custo_medio != null ? `R$ ${numero(i.custo_medio, 2)}` : '—'}</td>
                      <td className="px-3 py-2 text-right">{i.ultimo_preco != null ? `R$ ${numero(i.ultimo_preco, 2)} em ${data(i.data_ultima_compra)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
};
