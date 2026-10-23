import React, { useState } from 'react';
import { LogOut, UserCircle2, Check, Beef, BellRing } from 'lucide-react';
import { FuncionarioResumo } from '../types';
import { Cartao, Vazio } from './ui';
import { RebanhoArea } from './RebanhoArea';

const CHAVE_FUNCIONARIO = 'rebanho_funcionario_id';

interface FuncionarioHomeProps {
  fazenda: { id: number; nome: string };
  funcionarios: FuncionarioResumo[];
  aoSair: () => void;
}

// Tela do acesso simplificado (código + PIN). O funcionário escolhe o próprio nome;
// esse nome vai junto em cada evento que ele lançar.
export const FuncionarioHome: React.FC<FuncionarioHomeProps> = ({ fazenda, funcionarios, aoSair }) => {
  const [selecionadoId, setSelecionadoId] = useState<number | null>(() => {
    const salvo = Number(localStorage.getItem(CHAVE_FUNCIONARIO));
    return funcionarios.some(f => f.id === salvo) ? salvo : null;
  });
  const selecionado = funcionarios.find(f => f.id === selecionadoId);
  const [visao, setVisao] = useState<'alertas' | 'rebanho'>('alertas');

  const escolher = (id: number | null) => {
    setSelecionadoId(id);
    if (id) localStorage.setItem(CHAVE_FUNCIONARIO, String(id));
    else localStorage.removeItem(CHAVE_FUNCIONARIO);
  };

  const sair = () => {
    localStorage.removeItem(CHAVE_FUNCIONARIO);
    aoSair();
  };

  return (
    <div className="min-h-screen">
      <header className="bg-[#050D21] text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <img src="/logo_final.png" alt="AleEdu" className="h-8 w-auto" />
          <button onClick={sair} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"><LogOut size={18} /> Sair</button>
        </div>
        <div className="max-w-2xl mx-auto mt-6">
          <p className="text-[#56E39F] text-xs font-bold uppercase tracking-widest">Fazenda</p>
          <h1 className="text-2xl font-bold mt-1">{fazenda.nome}</h1>
          {selecionado && <p className="text-gray-300 text-sm mt-1">Olá, {selecionado.nome}!</p>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-4 pb-10 space-y-4">
        {!selecionado ? (
          <Cartao className="p-5">
            <h2 className="font-bold text-gray-900">Quem é você?</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-4">Escolha seu nome. Ele fica registrado em tudo o que você lançar.</p>
            {funcionarios.length === 0 ? (
              <Vazio icone={<UserCircle2 />} titulo="Nenhum funcionário cadastrado" texto="Peça ao consultor para cadastrar a equipe da fazenda." />
            ) : (
              <div className="grid gap-2">
                {funcionarios.map(f => (
                  <button key={f.id} onClick={() => escolher(f.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#56E39F] hover:bg-green-50/50 text-left transition">
                    <UserCircle2 className="text-gray-400" size={28} />
                    <span>
                      <span className="block font-semibold text-gray-900">{f.nome}</span>
                      {f.funcao && <span className="block text-xs text-gray-500">{f.funcao}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Cartao>
        ) : (
          <>
            <Cartao className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#56E39F]/20 text-[#050D21] flex items-center justify-center"><Check size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500">Lançando como</p>
                  <p className="font-semibold text-gray-900">{selecionado.nome}</p>
                </div>
              </div>
              <button onClick={() => escolher(null)} className="text-sm font-semibold text-gray-500 hover:text-gray-900">Trocar</button>
            </Cartao>
            <div className="grid grid-cols-2 gap-1 bg-white border border-gray-200 p-1 rounded-xl">
              {([['alertas', 'Alertas do dia', BellRing], ['rebanho', 'Rebanho', Beef]] as const).map(([v, rotulo, Icone]) => (
                <button key={v} onClick={() => setVisao(v)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${visao === v ? 'bg-[#050D21] text-white' : 'text-gray-500'}`}>
                  <Icone size={16} /> {rotulo}
                </button>
              ))}
            </div>
            <RebanhoArea fazendaId={fazenda.id} visao={visao} ehGestor={false} funcionarioId={selecionado.id} />
          </>
        )}
      </main>
    </div>
  );
};
