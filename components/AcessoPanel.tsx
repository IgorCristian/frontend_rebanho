import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, KeyRound, RefreshCw, Power, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Fazenda } from '../types';
import { Botao, Campo, Entrada, Cartao, Selo } from './ui';

interface Props {
  fazenda: Fazenda;
  aoMudar: (f: Fazenda) => void;
}

// Acesso simplificado dos funcionários: código da fazenda + PIN (só o consultor responsável / admin)
export const AcessoPanel: React.FC<Props> = ({ fazenda, aoMudar }) => {
  const [pin, setPin] = useState('');
  const [salvando, setSalvando] = useState(false);
  const ativo = !!fazenda.acesso_simplificado_ativo;

  const executar = async (acao: () => Promise<Fazenda>, mensagem: string) => {
    setSalvando(true);
    try {
      aoMudar(await acao());
      toast.success(mensagem);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const salvarPin = () => {
    if (!/^\d{4,6}$/.test(pin)) return toast.error('O PIN deve ter de 4 a 6 números.');
    executar(() => api.definirPin(fazenda.id, pin), ativo ? 'PIN alterado. Os funcionários precisam entrar de novo.' : 'Acesso dos funcionários ligado.')
      .then(() => setPin(''));
  };

  const desligar = () => {
    if (!confirm('Desligar o acesso dos funcionários? Todos que estiverem conectados com o código + PIN saem na hora.')) return;
    executar(() => api.definirPin(fazenda.id, null), 'Acesso dos funcionários desligado.');
  };

  const novoCodigo = () => {
    if (!confirm('Gerar um novo código? O código atual para de funcionar e você terá que passar o novo para a equipe.')) return;
    executar(() => api.gerarNovoCodigo(fazenda.id), 'Novo código gerado.');
  };

  const copiar = () => {
    navigator.clipboard?.writeText(fazenda.codigo_acesso || '').then(() => toast.success('Código copiado.'));
  };

  return (
    <div className="space-y-4">
      <Cartao className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Acesso dos funcionários</h2>
            <p className="text-sm text-gray-500 mt-0.5">Os funcionários entram na tela "Funcionário" com o código da fazenda e o PIN, sem precisar de e-mail.</p>
          </div>
          <Selo cor={ativo ? 'verde' : 'cinza'}>{ativo ? 'Ligado' : 'Desligado'}</Selo>
        </div>

        <div className="mt-5 rounded-2xl bg-[#050D21] text-white p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Código da fazenda</p>
            <p className="text-3xl font-bold tracking-[0.3em] text-[#56E39F] mt-1">{fazenda.codigo_acesso}</p>
          </div>
          <button onClick={copiar} className="p-3 rounded-xl bg-white/10 hover:bg-white/20" title="Copiar"><Copy size={20} /></button>
        </div>
      </Cartao>

      <Cartao className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><KeyRound size={18} /> {ativo ? 'Trocar o PIN' : 'Definir o PIN e ligar o acesso'}</h3>
        <div className="flex gap-2 items-end">
          <Campo rotulo="Novo PIN" dica="De 4 a 6 números. O PIN não fica visível depois de salvo." className="flex-1">
            <Entrada type="text" inputMode="numeric" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Ex.: 4821" className="tracking-[0.4em]" />
          </Campo>
          <Botao onClick={salvarPin} carregando={salvando} className="mb-[22px]">Salvar</Botao>
        </div>
      </Cartao>

      <Cartao className="p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ShieldCheck size={18} /> Segurança</h3>
        <p className="text-sm text-gray-500">Se o código ou o PIN vazar, gere um código novo ou desligue o acesso. Depois de 5 tentativas erradas por minuto o login é bloqueado temporariamente.</p>
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" icone={<RefreshCw size={16} />} onClick={novoCodigo} disabled={salvando}>Gerar novo código</Botao>
          {ativo && <Botao variante="perigo" icone={<Power size={16} />} onClick={desligar} disabled={salvando}>Desligar acesso</Botao>}
        </div>
      </Cartao>
    </div>
  );
};
