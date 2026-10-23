import React from 'react';
import { LogOut, ArrowLeftRight } from 'lucide-react';

export interface ItemMenu {
  id: string;
  rotulo: string;
  icone: React.ElementType;
}

interface Props {
  titulo: string;                       // nome da fazenda
  itens: ItemMenu[];
  ativo: string;
  aoNavegar: (id: string) => void;
  usuario: { nome: string; detalhe: string };
  aoSair: () => void;
  trocar?: { rotulo: string; acao: () => void };   // trocar fazenda / trocar funcionário
  children: React.ReactNode;
}

// Estrutura da área da fazenda: menu lateral no computador e menu inferior no celular
// (mesma identidade do painel corporativo do AleEdu: marinho #050D21 + menta #56E39F).
export const AppShell: React.FC<Props> = ({ titulo, itens, ativo, aoNavegar, usuario, aoSair, trocar, children }) => (
  <div className="min-h-screen lg:flex">
    {/* Menu lateral (computador) */}
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 bg-[#050D21] text-white h-screen sticky top-0">
      <div className="p-6 pb-4">
        <img src="/logo_final.png" alt="AleEdu" className="h-10 w-auto" />
        <span className="block text-[#56E39F] text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Rebanho</span>
      </div>
      <div className="px-6 pb-4 border-b border-white/10">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Fazenda</p>
        <p className="font-bold text-lg leading-tight mt-0.5">{titulo}</p>
        {trocar && (
          <button onClick={trocar.acao} className="mt-2 flex items-center gap-1.5 text-xs text-[#56E39F] hover:underline">
            <ArrowLeftRight size={14} /> {trocar.rotulo}
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {itens.map(({ id, rotulo, icone: Icone }) => (
          <button key={id} onClick={() => aoNavegar(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${ativo === id ? 'bg-[#56E39F] text-[#050D21]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
            <Icone size={20} /> {rotulo}
          </button>
        ))}
      </nav>
      <div className="p-4 bg-[#0a1a3f]/50 border-t border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{usuario.nome}</p>
          <p className="text-[11px] text-gray-400 truncate">{usuario.detalhe}</p>
        </div>
        <button onClick={aoSair} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" title="Sair" aria-label="Sair"><LogOut size={20} /></button>
      </div>
    </aside>

    {/* Topo (celular) */}
    <header className="lg:hidden bg-[#050D21] text-white sticky top-0 z-30">
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <img src="/logo_final.png" alt="AleEdu" className="h-7 w-auto shrink-0" />
          <div className="min-w-0 border-l border-white/20 pl-3">
            <p className="text-sm font-bold truncate leading-tight">{titulo}</p>
            {trocar && <button onClick={trocar.acao} className="text-[11px] text-[#56E39F] leading-tight">{trocar.rotulo}</button>}
          </div>
        </div>
        <button onClick={aoSair} className="p-2 text-gray-400 hover:text-white" aria-label="Sair"><LogOut size={20} /></button>
      </div>
    </header>

    <main className="flex-1 min-w-0 pb-28 lg:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-5 lg:py-8">{children}</div>
    </main>

    {/* Menu inferior (celular) */}
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-safe">
      <div className="flex h-16">
        {itens.map(({ id, rotulo, icone: Icone }) => (
          <button key={id} onClick={() => aoNavegar(id)} className="flex-1 flex flex-col items-center justify-center gap-1">
            <Icone size={22} strokeWidth={ativo === id ? 2.5 : 2} className={ativo === id ? 'text-[#4CD090]' : 'text-gray-400'} />
            <span className={`text-[10px] ${ativo === id ? 'font-bold text-[#050D21]' : 'text-gray-400'}`}>{rotulo}</span>
          </button>
        ))}
      </div>
    </nav>
  </div>
);

// Abas dentro de uma página
export const Abas: React.FC<{ abas: { id: string; rotulo: string }[]; ativa: string; aoMudar: (id: string) => void }> = ({ abas, ativa, aoMudar }) => (
  <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 mb-4 border-b border-gray-200">
    {abas.map(a => (
      <button key={a.id} onClick={() => aoMudar(a.id)}
        className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-[1px] transition ${ativa === a.id ? 'border-[#56E39F] text-[#050D21]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
        {a.rotulo}
      </button>
    ))}
  </nav>
);

export const TituloPagina: React.FC<{ titulo: string; descricao?: string; acao?: React.ReactNode }> = ({ titulo, descricao, acao }) => (
  <div className="flex items-end justify-between gap-3 mb-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
      {descricao && <p className="text-sm text-gray-500 mt-0.5">{descricao}</p>}
    </div>
    {acao}
  </div>
);
