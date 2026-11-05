// Cada tela tem um endereço depois do # (ex.: #/fazendas/1/rebanho/animal/45). É o que mantém a tela ao recarregar
// e dá histórico ao botão Voltar do navegador. Com # o servidor não precisa de configuração nenhuma ao publicar.
import { useSyncExternalStore } from 'react';

const assinar = (aviso: () => void) => {
  window.addEventListener('hashchange', aviso);
  return () => window.removeEventListener('hashchange', aviso);
};

/** Partes do endereço atual: #/fazendas/1/alertas → ['fazendas', '1', 'alertas'] */
export const useRota = (): string[] => {
  const hash = useSyncExternalStore(assinar, () => window.location.hash);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
};

/** Vai para outra tela. Com `substituir`, não cria passo no histórico: use em redirecionamentos e telas que não existem
 *  mais, senão o Voltar cairia de novo nelas e nunca sairia do lugar. */
export const navegar = (caminho: string, opcoes: { substituir?: boolean } = {}) => {
  const alvo = `#${caminho}`;
  if (window.location.hash === alvo) return;
  if (opcoes.substituir) {
    window.history.replaceState(null, '', alvo);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = alvo;
    window.scrollTo(0, 0);
  }
};
