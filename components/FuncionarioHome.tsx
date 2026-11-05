import React, { useState } from 'react';
import { LogOut, UserCircle2, Beef, BellRing, Milk } from 'lucide-react';
import { FuncionarioResumo } from '../types';
import { AJUDA } from '../services/ajuda';
import { navegar, useRota } from '../services/rota';
import { Ajuda, Cartao, Vazio } from './ui';
import { AppShell, TituloPagina, ItemMenu } from './AppShell';
import { RebanhoArea } from './RebanhoArea';
import { SaidaLeitePanel } from './SaidaLeitePanel';

const CHAVE_FUNCIONARIO = 'rebanho_funcionario_id';

const MENU: ItemMenu[] = [
  { id: 'alertas', rotulo: 'Alertas', icone: BellRing },
  { id: 'rebanho', rotulo: 'Rebanho', icone: Beef },
  { id: 'leite', rotulo: 'Leite', icone: Milk },
];

interface FuncionarioHomeProps {
  fazenda: { id: number; nome: string };
  funcionarios: FuncionarioResumo[];
  aoSair: () => void;
}

// Acesso simplificado (código + PIN). O funcionário escolhe o próprio nome;
// esse nome vai junto em cada evento que ele lançar.
export const FuncionarioHome: React.FC<FuncionarioHomeProps> = ({ fazenda, funcionarios, aoSair }) => {
  const [selecionadoId, setSelecionadoId] = useState<number | null>(() => {
    const salvo = Number(localStorage.getItem(CHAVE_FUNCIONARIO));
    return funcionarios.some(f => f.id === salvo) ? salvo : null;
  });
  const rota = useRota();
  const pagina = rota[0] === 'rebanho' || rota[0] === 'leite' ? rota[0] : 'alertas';
  const animalId = rota[1] === 'animal' && Number(rota[2]) > 0 ? Number(rota[2]) : null;
  const selecionado = funcionarios.find(f => f.id === selecionadoId);

  const escolher = (id: number | null) => {
    setSelecionadoId(id);
    if (id) localStorage.setItem(CHAVE_FUNCIONARIO, String(id));
    else localStorage.removeItem(CHAVE_FUNCIONARIO);
  };

  const sair = () => {
    localStorage.removeItem(CHAVE_FUNCIONARIO);
    aoSair();
  };

  if (selecionado) {
    return (
      <AppShell
        titulo={fazenda.nome}
        itens={MENU}
        ativo={pagina}
        aoNavegar={(id) => navegar(`/${id}`)}
        usuario={{ nome: selecionado.nome, detalhe: selecionado.funcao || 'Acesso da fazenda' }}
        aoSair={sair}
        trocar={{ rotulo: `Lançando como ${selecionado.nome} · trocar`, acao: () => escolher(null) }}
      >
        {pagina === 'leite' ? (
          <>
            <TituloPagina titulo="Saída de leite" descricao="Quanto o caminhão recolheu em cada dia" ajuda={AJUDA.saidaLeite} />
            <SaidaLeitePanel fazendaId={fazenda.id} funcionarioId={selecionado.id} />
          </>
        ) : (
          <>
            <TituloPagina titulo={pagina === 'alertas' ? 'Alertas do dia' : 'Rebanho'} ajuda={pagina === 'alertas' ? AJUDA.alertas : AJUDA.animais}
              descricao={pagina === 'alertas' ? `Olá, ${selecionado.nome}! Isto é o que precisa ser feito hoje.` : undefined} />
            <RebanhoArea fazendaId={fazenda.id} visao={pagina} ehGestor={false} funcionarioId={selecionado.id} animalId={animalId}
              aoAbrirAnimal={(id) => navegar(`/${pagina}/animal/${id}`)}
              aoVoltarDaFicha={(fichaSumiu) => navegar(`/${pagina}`, { substituir: fichaSumiu })} />
          </>
        )}
      </AppShell>
    );
  }

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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-4 pb-10">
        <Cartao className="p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">Quem é você? <Ajuda item={AJUDA.quemEVoce} /></h2>
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
      </main>
    </div>
  );
};
