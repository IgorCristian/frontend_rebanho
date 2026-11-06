import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

// Aviso de "Nova versão" do PWA (mesmo comportamento do AleEdu)
export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        r.update();
        setInterval(() => r.update(), 60 * 1000);
      }
    },
  });

  const [atualizando, setAtualizando] = useState(false);

  // Numa página sem service worker no controle (primeira visita ou recarregamento forçado), a versão nova
  // já entra ativa, sem ficar na espera, e o plugin não recarrega sozinho. Por isso o botão sempre recarrega.
  const atualizar = async () => {
    setAtualizando(true);
    const recarregar = () => window.location.reload();
    const registro = await navigator.serviceWorker?.getRegistration();
    const naEspera = registro?.waiting;
    if (!naEspera) {
      recarregar();
      return;
    }
    naEspera.addEventListener('statechange', () => {
      if (naEspera.state === 'activated') recarregar();
    });
    setTimeout(recarregar, 5000);
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] bg-[#050D21] text-white p-5 rounded-xl shadow-2xl border border-[#56E39F] max-w-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-[#56E39F]" size={20} />
          <h3 className="font-bold text-lg">Nova versão</h3>
        </div>
        <button onClick={() => setNeedRefresh(false)} className="text-gray-400 hover:text-white p-1" aria-label="Fechar"><X size={20} /></button>
      </div>
      <p className="text-sm text-gray-300 mt-3">Uma atualização está pronta. O app será recarregado para aplicar as melhorias.</p>
      <button
        onClick={atualizar}
        disabled={atualizando}
        className="w-full mt-4 bg-[#56E39F] text-[#050D21] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#4CD090] transition disabled:opacity-70"
      >
        <RefreshCw size={18} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar agora'}
      </button>
    </div>
  );
};
