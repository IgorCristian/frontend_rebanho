import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Tractor, UserCog } from 'lucide-react';
import { api, sessaoStorage } from './services/api';
import { navegar, useRota } from './services/rota';
import { Fazenda, Sessao } from './types';
import { LoginScreen } from './components/LoginScreen';
import { AppHeader } from './components/AppHeader';
import { FazendasList } from './components/FazendasList';
import { ConsultoresPanel } from './components/ConsultoresPanel';
import { FazendaArea } from './components/FazendaArea';
import { FuncionarioHome } from './components/FuncionarioHome';
import { ReloadPrompt } from './components/ReloadPrompt';

const App: React.FC = () => {
  const [sessao, setSessao] = useState<Sessao | null>(() => sessaoStorage.carregar());
  const rota = useRota();

  const encerrarSessao = () => {
    sessaoStorage.limpar();
    setSessao(null);
  };

  const sair = () => {
    encerrarSessao();
    navegar('/', { substituir: true });
  };

  // Token vencido ou acesso desligado: a API avisa e voltamos para o login, mantendo o endereço para continuar dali
  useEffect(() => {
    window.addEventListener('auth-expired', encerrarSessao);
    return () => window.removeEventListener('auth-expired', encerrarSessao);
  }, []);

  // Atualiza os dados da sessão (ex.: lista de funcionários) ao abrir o app
  useEffect(() => {
    if (!sessao) return;
    api.me().then((dados) => {
      const atual = dados.tipo === 'fazenda'
        ? { tipo: 'fazenda' as const, fazenda: dados.fazenda, funcionarios: dados.funcionarios }
        : { tipo: 'usuario' as const, usuario: dados.usuario };
      sessaoStorage.salvar(localStorage.getItem('rebanho_token') || '', atual);
      setSessao(atual);
    }).catch(() => { /* sem internet: segue com a sessão salva */ });
  }, []);

  const entrar = (token: string, nova: Sessao) => {
    sessaoStorage.salvar(token, nova);
    setSessao(nova);
  };

  let conteudo: React.ReactNode;
  if (!sessao) {
    conteudo = <LoginScreen aoEntrar={entrar} />;
  } else if (sessao.tipo === 'fazenda') {
    conteudo = <FuncionarioHome fazenda={sessao.fazenda} funcionarios={sessao.funcionarios} aoSair={sair} />;
  } else if (rota[0] === 'fazendas' && Number(rota[1]) > 0) {
    conteudo = <FazendaArea key={rota[1]} fazendaId={Number(rota[1])} usuario={sessao.usuario} caminho={rota.slice(2)} aoSair={sair} />;
  } else {
    const usuario = sessao.usuario;
    const ehAdmin = usuario.papel === 'admin';
    const tela = rota[0] === 'consultores' && ehAdmin ? 'consultores' : 'fazendas';
    conteudo = (
      <div className="min-h-screen pb-10">
        <AppHeader usuario={usuario} aoSair={sair} aoClicarLogo={() => navegar('/')} />

        {ehAdmin && (
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 flex gap-6">
              {([['fazendas', 'Fazendas', Tractor], ['consultores', 'Consultores', UserCog]] as const).map(([nome, rotulo, Icone]) => (
                <button key={nome} onClick={() => navegar(nome === 'consultores' ? '/consultores' : '/')}
                  className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition ${tela === nome ? 'border-[#56E39F] text-[#050D21]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                  <Icone size={18} /> {rotulo}
                </button>
              ))}
            </div>
          </nav>
        )}

        <main className="max-w-5xl mx-auto px-4 py-6">
          {tela === 'consultores' ? (
            <ConsultoresPanel />
          ) : (
            <FazendasList usuario={usuario} aoAbrir={(f: Fazenda) => navegar(`/fazendas/${f.id}/alertas`)} />
          )}
        </main>
      </div>
    );
  }

  return (
    <>
      {conteudo}
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
      <ReloadPrompt />
    </>
  );
};

export default App;
