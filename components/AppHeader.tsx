import React from 'react';
import { LogOut } from 'lucide-react';
import { Usuario, PAPEIS_LABEL } from '../types';

interface AppHeaderProps {
  usuario: Usuario;
  aoSair: () => void;
  aoClicarLogo?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ usuario, aoSair, aoClicarLogo }) => (
  <header className="bg-[#050D21] text-white sticky top-0 z-30">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <button onClick={aoClicarLogo} className="flex items-center gap-3" aria-label="Início">
        <img src="/logo_final.png" alt="AleEdu" className="h-8 w-auto" />
        <span className="hidden sm:inline text-[#56E39F] text-[10px] font-bold uppercase tracking-[0.3em] border-l border-white/20 pl-3">Rebanho</span>
      </button>
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold truncate max-w-[140px] sm:max-w-none">{usuario.nome}</p>
          <p className="text-[11px] text-gray-400">{PAPEIS_LABEL[usuario.papel]}</p>
        </div>
        <button onClick={aoSair} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10" aria-label="Sair" title="Sair">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  </header>
);
