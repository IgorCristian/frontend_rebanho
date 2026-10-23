import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, Hash, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Sessao } from '../types';

interface LoginScreenProps {
  aoEntrar: (token: string, sessao: Sessao) => void;
}

type Modo = 'usuario' | 'fazenda';

const ESTILO_INPUT = 'w-full pl-8 py-2 bg-transparent border-b border-gray-600 text-white placeholder-gray-600 focus:outline-none focus:border-[#56E39F] transition-colors';

export const LoginScreen: React.FC<LoginScreenProps> = ({ aoEntrar }) => {
  const [modo, setModo] = useState<Modo>('usuario');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pin, setPin] = useState('');

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setErro('');
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'usuario') {
        const dados = await api.login(email.trim(), senha);
        aoEntrar(dados.token, { tipo: 'usuario', usuario: dados.usuario });
      } else {
        const dados = await api.loginFazenda(codigo.trim(), pin.trim());
        aoEntrar(dados.token, { tipo: 'fazenda', fazenda: dados.fazenda, funcionarios: dados.funcionarios });
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050D21] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-[#56E39F] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>

      <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo_final.png" alt="AleEdu" className="h-12 w-auto mb-3" />
          <span className="text-[#56E39F] text-xs font-bold uppercase tracking-[0.3em]">Rebanho</span>
          <h2 className="text-2xl font-bold text-white tracking-wide text-center mt-4">Bem-vindo</h2>
          <p className="text-gray-400 text-sm mt-1 text-center">
            {modo === 'usuario' ? 'Entre com seu e-mail e senha' : 'Entre com o código da fazenda e o PIN'}
          </p>
        </div>

        {/* Quem está entrando */}
        <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl mb-6">
          {([['usuario', 'Consultor / equipe'], ['fazenda', 'Funcionário']] as [Modo, string][]).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => trocarModo(valor)}
              className={`py-2 rounded-lg text-sm font-semibold transition ${modo === valor ? 'bg-[#56E39F] text-[#050D21]' : 'text-gray-400 hover:text-white'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <form onSubmit={entrar} className="space-y-6">
          {modo === 'usuario' ? (
            <>
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1 uppercase">Email</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-0 text-gray-500 group-focus-within:text-[#56E39F] transition-colors" size={20} />
                  <input type="email" required autoComplete="email" className={ESTILO_INPUT} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1 uppercase">Senha</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-0 text-gray-500 group-focus-within:text-[#56E39F] transition-colors" size={20} />
                  <input type={mostrarSenha ? 'text' : 'password'} required autoComplete="current-password" className={`${ESTILO_INPUT} pr-10`} placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)} />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-0 text-gray-500 hover:text-[#56E39F] transition-colors p-1" aria-label="Mostrar senha">
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1 uppercase">Código da fazenda</label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-0 text-gray-500 group-focus-within:text-[#56E39F] transition-colors" size={20} />
                  <input
                    required maxLength={6} autoCapitalize="characters" autoComplete="off"
                    className={`${ESTILO_INPUT} uppercase tracking-[0.3em] font-semibold`}
                    placeholder="EX: K7M2QA" value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-1 ml-1 uppercase">PIN</label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-0 text-gray-500 group-focus-within:text-[#56E39F] transition-colors" size={20} />
                  <input
                    required type="password" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="off"
                    className={`${ESTILO_INPUT} tracking-[0.5em]`}
                    placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">O código e o PIN são passados pelo seu consultor.</p>
              </div>
            </>
          )}

          {erro && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm whitespace-pre-line">{erro}</div>}

          <button
            type="submit" disabled={carregando}
            className="w-full bg-[#56E39F] text-[#050D21] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#4CD090] transition disabled:opacity-60"
          >
            {carregando ? <Loader2 size={20} className="animate-spin" /> : <>Entrar <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};
