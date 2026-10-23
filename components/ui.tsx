import React from 'react';
import { Loader2, X } from 'lucide-react';

// Peças visuais reaproveitadas em todas as telas (identidade AleEdu: marinho #050D21 + menta #56E39F)

type Variante = 'primario' | 'escuro' | 'secundario' | 'perigo' | 'fantasma';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-[#56E39F] text-[#050D21] hover:bg-[#4CD090]',
  escuro: 'bg-[#050D21] text-white hover:bg-[#0a1a3f]',
  secundario: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  perigo: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  fantasma: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
};

export const Botao: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante; carregando?: boolean; icone?: React.ReactNode;
}> = ({ variante = 'primario', carregando, icone, children, className = '', disabled, ...props }) => (
  <button
    {...props}
    disabled={disabled || carregando}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
  >
    {carregando ? <Loader2 size={18} className="animate-spin" /> : icone}
    {children}
  </button>
);

export const Campo: React.FC<{ rotulo: string; dica?: string; children: React.ReactNode; className?: string }> = ({ rotulo, dica, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{rotulo}</span>
    {children}
    {dica && <span className="block text-xs text-gray-400 mt-1">{dica}</span>}
  </label>
);

const ESTILO_INPUT = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#56E39F] focus:ring-2 focus:ring-[#56E39F]/30 transition disabled:bg-gray-50 disabled:text-gray-500';

export const Entrada = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => <input ref={ref} {...props} className={`${ESTILO_INPUT} ${className}`} />
);

export const Selecao: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select {...props} className={`${ESTILO_INPUT} ${className}`}>{children}</select>
);

export const AreaTexto: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea {...props} className={`${ESTILO_INPUT} ${className}`} />
);

export const Cartao: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Selo: React.FC<{ children: React.ReactNode; cor?: 'verde' | 'cinza' | 'azul' | 'amarelo' | 'vermelho' }> = ({ children, cor = 'cinza' }) => {
  const cores = {
    verde: 'bg-green-50 text-green-700 border-green-200',
    cinza: 'bg-gray-100 text-gray-600 border-gray-200',
    azul: 'bg-blue-50 text-blue-700 border-blue-200',
    amarelo: 'bg-amber-50 text-amber-700 border-amber-200',
    vermelho: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cores[cor]}`}>{children}</span>;
};

export const Janela: React.FC<{ titulo: string; aberta: boolean; aoFechar: () => void; children: React.ReactNode; rodape?: React.ReactNode }> = ({ titulo, aberta, aoFechar, children, rodape }) => {
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={aoFechar}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <button onClick={aoFechar} className="p-1 text-gray-400 hover:text-gray-700 rounded-full" aria-label="Fechar"><X size={22} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {rodape && <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2 pb-safe">{rodape}</div>}
      </div>
    </div>
  );
};

export const Vazio: React.FC<{ icone: React.ReactNode; titulo: string; texto?: string; acao?: React.ReactNode }> = ({ icone, titulo, texto, acao }) => (
  <div className="text-center py-12 px-6">
    <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">{icone}</div>
    <p className="font-semibold text-gray-700">{titulo}</p>
    {texto && <p className="text-sm text-gray-500 mt-1">{texto}</p>}
    {acao && <div className="mt-4">{acao}</div>}
  </div>
);

export const Carregando: React.FC<{ texto?: string }> = ({ texto = 'Carregando...' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
    <Loader2 size={20} className="animate-spin" /> {texto}
  </div>
);

export const TituloSecao: React.FC<{ titulo: string; descricao?: string; acao?: React.ReactNode }> = ({ titulo, descricao, acao }) => (
  <div className="flex items-start justify-between gap-3 mb-3">
    <div>
      <h2 className="font-bold text-gray-900">{titulo}</h2>
      {descricao && <p className="text-sm text-gray-500 mt-0.5">{descricao}</p>}
    </div>
    {acao}
  </div>
);
