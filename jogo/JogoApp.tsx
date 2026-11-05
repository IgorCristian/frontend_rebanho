import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { api, sessaoStorage } from '../services/api';
import { Alerta, AlertaDoDia, AnimalResumo, CulturaInfo, Fazenda, FichaAnimal, Lote, ManejoSanitario, Plantacao, Sessao } from '../types';
import { EVENTOS, eventoSeAplica } from '../services/eventos';
import { data as formatarData, hojeISO, idade as formatarIdade, SITUACAO_REPRODUTIVA } from '../services/formato';
import { LoginScreen } from '../components/LoginScreen';
import { LancarEventoJanela } from '../components/LancarEventoJanela';
import { NovoAnimalJanela } from '../components/NovoAnimalJanela';
import { ColheitaJanela, PlantacaoJanela, prazoDaPlantacao } from '../components/PlantacoesPanel';
import { AlvoInteracao, Motor, porteDoAnimal } from './motor';
import { Cultura, criarVaca, pelagemDa } from './arte';
import { ENFEITES_INFO, LAYOUT_PADRAO, Layout, PIQUETES_INFO, TipoEnfeite, ladrilhosDaPorteira } from './mapa';
import {
  IdElemento, LADOS, MAX_ENFEITES, MAX_ESTRADAS, adicionarEnfeite, adicionarEstrada, layoutValido, limitesDe, mudarPorteira, nomeDe, podeRemover, problemasDoMapa, removerElemento, retanguloDe,
} from './editor';

// ---------- Progresso (protótipo: fica só neste aparelho, por fazenda) ----------

const TITULOS = ['Ajudante do sítio', 'Tratador', 'Retireiro', 'Capataz', 'Gerente do rebanho', 'Mestre do leite'];
const XP_POR_NIVEL = 100;
const XP_TAREFA: Record<string, number> = { alta: 30, media: 20, baixa: 15 };
const XP_ANIMAL = 25;
const XP_LANCAMENTO = 5;

const PASSOS: { chave: string; texto: string }[] = [
  { chave: 'andar', texto: 'Ande pelo sítio (setas ou WASD)' },
  { chave: 'conversar', texto: 'Chegue perto de um animal e aperte E' },
  { chave: 'lancar', texto: 'Lance um evento nesse animal' },
  { chave: 'quadro', texto: 'Veja as tarefas no quadro de avisos' },
  { chave: 'cadastrar', texto: 'Cadastre um animal na porteira' },
  { chave: 'ordenha', texto: 'Lance o leite de todas na sala de ordenha' },
];

interface Progresso { xp: number; passos: string[] }
const chaveProgresso = (id: number) => `jogo_progresso_${id}`;
const lerProgresso = (id: number): Progresso => {
  try {
    return { xp: 0, passos: [], ...JSON.parse(localStorage.getItem(chaveProgresso(id)) || '{}') };
  } catch {
    return { xp: 0, passos: [] };
  }
};

const XP_COLHEITA = 20;

// O desenho só existe para três culturas: o resto (soja, feijão...) usa o do milho
const desenhoDaCultura = (cultura: string | null): Cultura => {
  const texto = (cultura || '').toLowerCase();
  return texto.includes('sorgo') ? 'sorgo' : /capim|brachi|braqui|mombaça/.test(texto) ? 'capim' : 'milho';
};
const areaNoJogo = (hectares: number | null) => (hectares == null ? '' : ` · ${hectares.toLocaleString('pt-BR')} ha`);

const paraNumero = (texto: string) => {
  const n = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(n) ? n : null;
};

// ---------- Entrada: login e escolha da fazenda / funcionário ----------

export const JogoApp: React.FC = () => {
  const [sessao, setSessao] = useState<Sessao | null>(() => sessaoStorage.carregar());
  const [fazenda, setFazenda] = useState<{ id: number; nome: string } | null>(null);
  const [fazendas, setFazendas] = useState<Fazenda[] | null>(null);
  const [funcionarioId, setFuncionarioId] = useState<number | undefined>();

  const sair = useCallback(() => {
    sessaoStorage.limpar();
    setSessao(null);
    setFazenda(null);
    setFazendas(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth-expired', sair);
    return () => window.removeEventListener('auth-expired', sair);
  }, [sair]);

  useEffect(() => {
    if (!sessao) return;
    if (sessao.tipo === 'fazenda') setFazenda(sessao.fazenda);
    else api.listarFazendas().then(setFazendas).catch(e => toast.error(e.message));
  }, [sessao]);

  let conteudo: React.ReactNode;
  if (!sessao) {
    conteudo = <LoginScreen aoEntrar={(token, nova) => { sessaoStorage.salvar(token, nova); setSessao(nova); }} />;
  } else if (sessao.tipo === 'fazenda' && !funcionarioId) {
    conteudo = (
      <div className="tela-escolha px">
        <div className="painel cartao">
          <h2>Quem está chegando no sítio?</h2>
          {sessao.funcionarios.map(f => (
            <button key={f.id} className="lista-opcao" onClick={() => setFuncionarioId(f.id)}>
              {f.nome}{f.funcao && <small>{f.funcao}</small>}
            </button>
          ))}
          {sessao.funcionarios.length === 0 && <p className="mt-2">Nenhum funcionário cadastrado nesta fazenda.</p>}
        </div>
      </div>
    );
  } else if (!fazenda) {
    conteudo = (
      <div className="tela-escolha px">
        <div className="painel cartao">
          <h2>Qual sítio você quer visitar?</h2>
          {fazendas === null && <p className="mt-2">Carregando...</p>}
          {fazendas?.map(f => (
            <button key={f.id} className="lista-opcao" onClick={() => setFazenda({ id: f.id, nome: f.nome })}>
              {f.nome}<small>{[f.cidade, f.uf].filter(Boolean).join(' / ') || 'Sem cidade informada'}</small>
            </button>
          ))}
          <div className="acoes"><button className="btn sec" onClick={sair}>Sair</button></div>
        </div>
      </div>
    );
  } else {
    conteudo = <Sitio key={fazenda.id} fazenda={fazenda} funcionarioId={funcionarioId} />;
  }

  return (
    <>
      {conteudo}
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '4px', fontSize: '14px' } }} />
    </>
  );
};

// ---------- O sítio ----------

type Tela =
  | { nome: 'animal'; id: number; ficha: FichaAnimal | null }
  | { nome: 'quadro' }
  | { nome: 'sede' }
  | { nome: 'ordenha' }
  | { nome: 'lavoura' }
  | null;

interface Lancando { tipo: string | null; dados?: Record<string, any> }

const Sitio: React.FC<{ fazenda: { id: number; nome: string }; funcionarioId?: number }> = ({ fazenda, funcionarioId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motorRef = useRef<Motor | null>(null);

  const [animais, setAnimais] = useState<AnimalResumo[]>([]);
  const [alertas, setAlertas] = useState<AlertaDoDia[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [calendario, setCalendario] = useState<ManejoSanitario[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [perfil, setPerfil] = useState<string | null>(null);

  const [proximo, setProximo] = useState<AlvoInteracao | null>(null);
  const [tela, setTela] = useState<Tela>(null);
  const [lancando, setLancando] = useState<Lancando | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const [alvo, setAlvo] = useState<number | null>(null);
  const [tarefasAbertas, setTarefasAbertas] = useState(() => window.innerWidth >= 700);
  const [progresso, setProgresso] = useState<Progresso>(() => lerProgresso(fazenda.id));
  const [nivelNovo, setNivelNovo] = useState<number | null>(null);
  const [relogio, setRelogio] = useState(new Date());
  const [layoutSalvo, setLayoutSalvo] = useState<Layout>(LAYOUT_PADRAO);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Layout>(LAYOUT_PADRAO);
  const [historico, setHistorico] = useState<Layout[]>([]);
  const [selecionado, setSelecionado] = useState<IdElemento | null>(null);
  const [salvandoMapa, setSalvandoMapa] = useState(false);
  const [plantacoes, setPlantacoes] = useState<Plantacao[]>([]);
  const [culturas, setCulturas] = useState<CulturaInfo[]>([]);
  const [editandoPlantacao, setEditandoPlantacao] = useState<Plantacao | 'nova' | null>(null);
  const [colhendo, setColhendo] = useState<Plantacao | null>(null);

  // O mapa tem uma área de plantio: mostra o que está mais perto do corte (a lista já vem nessa ordem)
  const noCampo = useMemo(() => plantacoes.filter(p => !p.data_colheita), [plantacoes]);
  useEffect(() => {
    const p = noCampo[0];
    motorRef.current?.setLavoura(p ? {
      cultura: desenhoDaCultura(p.cultura), progresso: p.progresso ?? 0.5,
      rotulo: `${p.nome}${p.progresso !== null ? ` · ${Math.round(p.progresso * 100)}%` : ''}${noCampo.length > 1 ? ` · +${noCampo.length - 1}` : ''}`,
    } : null);
  }, [noCampo]);

  const concluirPasso = useCallback((chave: string) => {
    setProgresso((p) => {
      if (p.passos.includes(chave)) return p;
      const novo = { ...p, passos: [...p.passos, chave] };
      localStorage.setItem(chaveProgresso(fazenda.id), JSON.stringify(novo));
      return novo;
    });
  }, [fazenda.id]);

  const ganharXp = useCallback((pontos: number) => {
    setProgresso((p) => {
      const novo = { ...p, xp: p.xp + pontos };
      localStorage.setItem(chaveProgresso(fazenda.id), JSON.stringify(novo));
      const nivelAntes = Math.floor(p.xp / XP_POR_NIVEL), nivelAgora = Math.floor(novo.xp / XP_POR_NIVEL);
      if (nivelAgora > nivelAntes) {
        setNivelNovo(nivelAgora + 1);
        setTimeout(() => setNivelNovo(null), 2800);
      }
      return novo;
    });
  }, [fazenda.id]);

  const recarregar = useCallback(async () => {
    const [lista, avisos] = await Promise.all([api.listarAnimais(fazenda.id), api.alertasDoDia(fazenda.id)]);
    setAnimais(lista);
    setAlertas(avisos);
    motorRef.current?.setAnimais(lista);
    return { lista, avisos };
  }, [fazenda.id]);

  const carregarPlantacoes = useCallback(() => api.listarPlantacoes(fazenda.id)
    .then((r) => { setPlantacoes(r.plantacoes); setCulturas(r.culturas); })
    .catch(e => toast.error(e.message)), [fazenda.id]);

  const interagirRef = useRef<(a: AlvoInteracao) => void>(() => {});
  const editarRef = useRef<(novo: Layout) => void>(() => {});

  // Liga o motor uma vez e busca os dados
  useEffect(() => {
    const motor = new Motor(canvasRef.current!, {
      aoInteragir: a => interagirRef.current(a),
      aoMudarProximo: setProximo,
      aoAndar: () => concluirPasso('andar'),
      aoSelecionar: setSelecionado,
      aoEditar: novo => editarRef.current(novo),
    });
    motorRef.current = motor;
    if (import.meta.env.DEV) (window as any).__jogo = motor;
    // O mapa vem antes dos animais: eles nascem nos piquetes do mapa da fazenda
    api.obterMapaJogo(fazenda.id)
      .then((r) => {
        const layout = layoutValido(r.layout);
        motor.setLayout(layout);
        setLayoutSalvo(layout);
      })
      .catch(e => toast.error(e.message))
      .finally(() => recarregar().catch(e => toast.error(e.message)));
    carregarPlantacoes();
    Promise.all([api.listarLotes(fazenda.id), api.listarCalendario(fazenda.id), api.tiposEvento(fazenda.id)])
      .then(([l, c, t]) => {
        setLotes(l);
        setCalendario(c);
        setTipos(t.tipos);
        setPerfil(t.perfil);
      })
      .catch(e => toast.error(e.message));
    const intervalo = setInterval(() => setRelogio(new Date()), 30000);
    return () => {
      motor.destruir();
      clearInterval(intervalo);
    };
  }, [fazenda.id, recarregar, carregarPlantacoes, concluirPasso]);

  // Com qualquer janela aberta, o personagem não anda e as teclas vão para o formulário
  const pausado = !!tela || !!lancando || cadastrando || !!editandoPlantacao || !!colhendo || editando;

  // Modo de edição: cada mudança passa pelo rascunho, que o motor desenha; só o Salvar grava no backend
  const aplicarEdicao = (novo: Layout, selecionar?: IdElemento | null) => {
    setHistorico(h => [...h.slice(-30), rascunho]);
    setRascunho(novo);
    motorRef.current?.setLayout(novo);
    if (selecionar !== undefined) {
      setSelecionado(selecionar);
      motorRef.current?.selecionar(selecionar);
    }
  };
  editarRef.current = aplicarEdicao;

  const entrarEdicao = () => {
    setRascunho(layoutSalvo);
    setHistorico([]);
    setSelecionado(null);
    setEditando(true);
    motorRef.current?.setEditando(true);
  };

  const sairEdicao = (layoutFinal: Layout) => {
    motorRef.current?.setLayout(layoutFinal);
    motorRef.current?.setEditando(false);
    setEditando(false);
  };

  const desfazerEdicao = () => {
    const anterior = historico[historico.length - 1];
    if (!anterior) return;
    setHistorico(historico.slice(0, -1));
    setRascunho(anterior);
    motorRef.current?.setLayout(anterior);
    setSelecionado(null);
    motorRef.current?.selecionar(null);
  };

  const salvarMapa = async () => {
    setSalvandoMapa(true);
    try {
      await api.salvarMapaJogo(fazenda.id, rascunho);
      setLayoutSalvo(rascunho);
      sairEdicao(rascunho);
      toast.success('Mapa salvo. Todo mundo que entrar nesta fazenda já vê assim.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSalvandoMapa(false);
    }
  };
  useEffect(() => { motorRef.current?.setPausado(pausado); }, [pausado]);
  useEffect(() => { motorRef.current?.setAlvo(alvo); }, [alvo]);

  const abrirAnimal = useCallback(async (id: number) => {
    setTela({ nome: 'animal', id, ficha: null });
    setAlvo(atual => (atual === id ? null : atual)); // chegou: a seta já cumpriu o papel
    motorRef.current?.falar(id);
    concluirPasso('conversar');
    try {
      const ficha = await api.obterAnimal(fazenda.id, id, funcionarioId);
      setTela(t => (t?.nome === 'animal' && t.id === id ? { ...t, ficha } : t));
    } catch (e: any) {
      toast.error(e.message);
      setTela(null);
    }
  }, [fazenda.id, funcionarioId, concluirPasso]);

  useEffect(() => {
    interagirRef.current = (a) => {
      if (a.tipo === 'animal') abrirAnimal(a.id);
      else if (a.tipo === 'porteira') {
        if (perfil === 'gestor') setCadastrando(true);
        else toast('Só o consultor cadastra animais novos.');
      } else if (a.tipo === 'quadro') {
        concluirPasso('quadro');
        setTela({ nome: 'quadro' });
      } else if (a.tipo === 'ordenha') {
        if (tipos.includes('controle_leiteiro')) setTela({ nome: 'ordenha' });
        else toast('Você não tem permissão para lançar o controle leiteiro.');
      } else if (a.tipo === 'lavoura') setTela({ nome: 'lavoura' });
      else setTela({ nome: 'sede' });
    };
  }, [abrirAnimal, perfil, tipos, concluirPasso]);

  // Ordenha em lote: uma recompensa só, com uma comemoração em cada vaca
  const aoLancarOrdenha = async (lancadas: { id: number; litros: number; antes: Alerta[]; depois: Alerta[] }[]) => {
    const resolvidos = lancadas.flatMap(l => l.antes.filter(a => !l.depois.some(d => d.codigo === a.codigo)));
    const pontos = resolvidos.reduce((s, a) => s + (XP_TAREFA[a.prioridade] || 15), 0) + lancadas.length * XP_LANCAMENTO;
    lancadas.forEach(l => motorRef.current?.comemorar(l.id, `${l.litros.toLocaleString('pt-BR')} L`, '#fff'));
    ganharXp(pontos);
    concluirPasso('ordenha');
    const total = lancadas.reduce((s, l) => s + l.litros, 0);
    toast.success(`${lancadas.length} ${lancadas.length === 1 ? 'vaca' : 'vacas'} · ${total.toLocaleString('pt-BR')} L · +${pontos} XP`);
    try {
      await recarregar();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Depois do lançamento: dá a recompensa, recarrega o rebanho e o animal anda para o piquete novo, se mudou de categoria
  const aoLancar = async (nova: FichaAnimal) => {
    const antes = tela?.nome === 'animal' && tela.ficha ? tela.ficha.alertas : [];
    const resolvidos = antes.filter(a => !nova.alertas.some(n => n.codigo === a.codigo));
    const pontos = resolvidos.length ? resolvidos.reduce((s, a) => s + (XP_TAREFA[a.prioridade] || 15), 0) : XP_LANCAMENTO;
    motorRef.current?.comemorar(nova.animal.id, `+${pontos} XP`);
    ganharXp(pontos);
    concluirPasso('lancar');
    if (resolvidos.length) toast.success(`Tarefa concluída: ${resolvidos.map(r => r.titulo).join(', ')}`);
    setLancando(null);
    setTela(null);
    try {
      await recarregar();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const aoCriar = async (id: number) => {
    setCadastrando(false);
    concluirPasso('cadastrar');
    ganharXp(XP_ANIMAL);
    try {
      const { lista } = await recarregar();
      const a = lista.find(x => x.id === id);
      if (a) {
        toast.success(`${a.nome || `Nº ${a.brinco}`} está indo para ${PIQUETES_INFO.find(q => q.categorias.includes(a.categoria || ''))?.nome || 'o pasto'}.`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const tarefasOrdenadas = useMemo(() => {
    const peso: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
    return [...alertas].sort((a, b) => peso[a.prioridade] - peso[b.prioridade]);
  }, [alertas]);

  const nivel = Math.floor(progresso.xp / XP_POR_NIVEL) + 1;
  const xpNoNivel = progresso.xp % XP_POR_NIVEL;
  const passosFaltando = PASSOS.some(p => !progresso.passos.includes(p.chave));
  const dataTexto = relogio.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  const horaTexto = relogio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const fichaAtual = tela?.nome === 'animal' ? tela.ficha : null;
  const resumoAtual = tela?.nome === 'animal' ? animais.find(a => a.id === tela.id) : undefined;

  const direcional = (tecla: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); motorRef.current?.pressionar(tecla, true); },
    onPointerUp: () => motorRef.current?.pressionar(tecla, false),
    onPointerLeave: () => motorRef.current?.pressionar(tecla, false),
    onPointerCancel: () => motorRef.current?.pressionar(tecla, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="jogo-tela px">
      <canvas ref={canvasRef} />

      <div className="hud-esquerda">
      <div className="hud-fazenda painel">
        <h1 title={fazenda.nome}>{fazenda.nome}</h1>
        <div className="hud-relogio">{dataTexto} · {horaTexto}</div>
        <div className="hud-nivel"><span>Nv {nivel} · {TITULOS[Math.min(nivel - 1, TITULOS.length - 1)]}</span></div>
        <div className="barra-xp" title={`${xpNoNivel} de ${XP_POR_NIVEL} XP`}><div style={{ width: `${xpNoNivel}%` }} /></div>
        {perfil === 'gestor' && !editando && <button className="btn sec peq hud-editar" onClick={entrarEdicao}>Editar fazenda</button>}
      </div>

      {passosFaltando && !editando && (
        <div className="hud-passos painel">
          <h2>Primeiros passos</h2>
          <ul>
            {PASSOS.map(p => (
              <li key={p.chave} className={progresso.passos.includes(p.chave) ? 'feito' : ''}><span className="marca" />{p.texto}</li>
            ))}
          </ul>
        </div>
      )}

      </div>

      {editando && (
        <PainelEdicao layout={rascunho} selecionado={selecionado} podeDesfazer={historico.length > 0} salvando={salvandoMapa}
          motor={motorRef.current} aoAplicar={aplicarEdicao} aoDesfazer={desfazerEdicao} aoSalvar={salvarMapa} aoCancelar={() => sairEdicao(layoutSalvo)} />
      )}

      {!editando && <div className="hud-tarefas painel">
        <button style={{ width: '100%' }} onClick={() => setTarefasAbertas(v => !v)}>
          <header><span>Tarefas de hoje<span className="selo-qtd">{alertas.length}</span></span><span>{tarefasAbertas ? '▴' : '▾'}</span></header>
        </button>
        {tarefasAbertas && (
          <div className="lista-tarefas">
            {noCampo.filter(p => p.status === 'ponto_de_corte').map(p => (
              <button key={p.id} className="tarefa" onClick={() => setTela({ nome: 'lavoura' })}>
                <span className="ponto alta" />
                <span>Hora de cortar<small>{p.nome}{areaNoJogo(p.hectares)}</small></span>
              </button>
            ))}
            {tarefasOrdenadas.length === 0 && <p className="tarefa">Tudo em dia por aqui!</p>}
            {tarefasOrdenadas.map(t => (
              <button key={`${t.animal.id}-${t.codigo}`} className={`tarefa ${alvo === t.animal.id ? 'ativa' : ''}`}
                onClick={() => setAlvo(alvo === t.animal.id ? null : t.animal.id)}>
                <span className={`ponto ${t.prioridade}`} />
                <span>{t.titulo}<small>{t.animal.nome || `nº ${t.animal.brinco}`}{alvo === t.animal.id ? ' · siga a seta' : ''}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>}

      {proximo && !pausado && (
        <div className="hud-dica painel" onClick={() => motorRef.current?.acionar()}>
          <span className="tecla">E</span>
          {proximo.tipo === 'animal' ? `Ver ${proximo.nome}` : proximo.tipo === 'porteira' ? 'Cadastrar animal' : proximo.tipo === 'quadro' ? 'Ver quadro de avisos' : proximo.tipo === 'ordenha' ? 'Lançar o leite de todas' : proximo.tipo === 'lavoura' ? 'Ver a plantação' : 'Entrar na sede'}
        </div>
      )}

      {!editando && <div className="hud-ajuda">
        Setas ou WASD para andar (seguem a tela) · E para interagir<br />
        <a href="/">Voltar ao sistema</a>
      </div>}

      {!editando && <>
      <div className="direcional">
        <button className="c" aria-label="Cima" {...direcional('arrowup')}>▲</button>
        <button className="b" aria-label="Baixo" {...direcional('arrowdown')}>▼</button>
        <button className="e" aria-label="Esquerda" {...direcional('arrowleft')}>◀</button>
        <button className="d" aria-label="Direita" {...direcional('arrowright')}>▶</button>
      </div>
      <button className="botao-acao" disabled={!proximo} onPointerDown={() => motorRef.current?.acionar()}>E</button>
      </>}

      {nivelNovo && (
        <div className="nivel-subiu painel">Subiu de nível!<b>Nv {nivelNovo}: {TITULOS[Math.min(nivelNovo - 1, TITULOS.length - 1)]}</b></div>
      )}

      {tela?.nome === 'animal' && !lancando && (
        <CartaoAnimal resumo={resumoAtual} ficha={fichaAtual} tipos={tipos}
          aoLancar={(tipo, dados) => setLancando({ tipo, dados })} aoFechar={() => setTela(null)} />
      )}

      {tela?.nome === 'quadro' && (
        <CartaoQuadro alertas={tarefasOrdenadas} aoSeguir={(id) => { setAlvo(id); setTela(null); }} aoFechar={() => setTela(null)} />
      )}

      {tela?.nome === 'sede' && <CartaoSede fazenda={fazenda.nome} animais={animais} alertas={alertas.length} aoFechar={() => setTela(null)} />}

      {tela?.nome === 'ordenha' && (
        <CartaoOrdenha fazendaId={fazenda.id} funcionarioId={funcionarioId}
          vacas={animais.filter(a => eventoSeAplica('controle_leiteiro', a.categoria))}
          aoLancar={aoLancarOrdenha} aoFechar={() => setTela(null)} />
      )}

      {tela?.nome === 'lavoura' && !editandoPlantacao && !colhendo && (
        <CartaoLavoura plantacoes={plantacoes} podeEditar={perfil === 'gestor'} aoNova={() => setEditandoPlantacao('nova')}
          aoCorrigir={setEditandoPlantacao} aoColher={setColhendo} aoFechar={() => setTela(null)} />
      )}

      {/* As janelas abaixo são as do sistema: mesmas regras, validações e textos de ajuda */}
      <div className="sistema">
      {fichaAtual && (
        <LancarEventoJanela aberta={!!lancando} fazendaId={fazenda.id} ficha={fichaAtual} tiposPermitidos={tipos} lotes={lotes}
          funcionarioId={funcionarioId} tipoInicial={lancando?.tipo} dadosIniciais={lancando?.dados} calendario={calendario}
          aoFechar={() => setLancando(null)} aoLancar={aoLancar} />
      )}
      <NovoAnimalJanela aberta={cadastrando} fazendaId={fazenda.id} lotes={lotes} aoFechar={() => setCadastrando(false)} aoCriar={aoCriar} />
      <PlantacaoJanela aberta={!!editandoPlantacao} fazendaId={fazenda.id} culturas={culturas} plantacao={editandoPlantacao === 'nova' ? null : editandoPlantacao}
        aoFechar={() => setEditandoPlantacao(null)}
        aoSalvar={() => { setEditandoPlantacao(null); carregarPlantacoes(); toast.success('Plantação salva. O sítio já mostra!'); }} />
      <ColheitaJanela plantacao={colhendo} fazendaId={fazenda.id} aoFechar={() => setColhendo(null)}
        aoSalvar={() => { setColhendo(null); carregarPlantacoes(); ganharXp(XP_COLHEITA); toast.success(`Colheita registrada. +${XP_COLHEITA} XP`); }} />
      </div>
    </div>
  );
};

// ---------- Cartões ----------

const Retrato: React.FC<{ a: AnimalResumo }> = ({ a }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cat = a.categoria || '';
    const s = criarVaca({
      pelagem: pelagemDa(a.raca, a.id), porte: porteDoAnimal(a.categoria), semente: a.id, dir: 0, passo: 0, pastando: false,
      ubere: cat === 'LAC' || cat === 'RPA', barriga: cat === 'PRE' || cat === 'NVP' || a.situacao_reprodutiva === 'prenhe',
    });
    const c = ref.current!;
    c.width = s.c.width;
    c.height = s.c.height;
    c.style.height = `${Math.min(s.h, 60)}px`;
    c.getContext('2d')!.drawImage(s.c, 0, 0);
  }, [a.id, a.categoria, a.raca]);
  return <div className="retrato"><canvas ref={ref} /></div>;
};

const Dado: React.FC<{ rotulo: string; valor: React.ReactNode }> = ({ rotulo, valor }) => (
  <div className="dado"><small>{rotulo}</small>{valor}</div>
);

const CartaoAnimal: React.FC<{
  resumo?: AnimalResumo; ficha: FichaAnimal | null; tipos: string[];
  aoLancar: (tipo: string | null, dados?: Record<string, any>) => void; aoFechar: () => void;
}> = ({ resumo, ficha, tipos, aoLancar, aoFechar }) => {
  const e = ficha?.estado;
  const podeResolver = (a: Alerta) => !!a.resolve_com && tipos.includes(a.resolve_com) && eventoSeAplica(a.resolve_com, e?.categoria || null);

  useEffect(() => {
    const fechar = (ev: KeyboardEvent) => { if (ev.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [aoFechar]);

  return (
    <div className="fundo-cartao" onClick={aoFechar}>
      <div className="cartao painel" onClick={ev => ev.stopPropagation()}>
        <div className="cartao-topo">
          {resumo && <Retrato a={resumo} />}
          <div>
            <h2>{resumo?.nome || `Nº ${resumo?.brinco}`}</h2>
            <div>Brinco {resumo?.brinco}{resumo?.raca ? ` · ${resumo.raca}` : ''}</div>
            <span className="cat">{resumo?.categoria_nome}</span>
          </div>
        </div>

        {!ficha && <p className="mt-3">Buscando a ficha...</p>}
        {ficha && e && (
          <>
            <div className="dados">
              {e.idade_meses !== null && <Dado rotulo="Idade" valor={formatarIdade(e.idade_meses)} />}
              <Dado rotulo="Lote" valor={e.lote?.nome || 'Sem lote'} />
              {e.del_ !== null && <Dado rotulo="Dias em lactação" valor={`${e.del_} dias`} />}
              {e.media_litros_dia !== null && <Dado rotulo="Média de leite" valor={`${e.media_litros_dia.toFixed(1)} L/dia`} />}
              {e.situacao_reprodutiva && <Dado rotulo="Reprodução" valor={SITUACAO_REPRODUTIVA[e.situacao_reprodutiva] || e.situacao_reprodutiva} />}
              {e.parto_previsto && <Dado rotulo="Parto previsto" valor={formatarData(e.parto_previsto)} />}
              {e.ultimo_peso !== null && <Dado rotulo="Último peso" valor={`${e.ultimo_peso} kg`} />}
            </div>

            {ficha.alertas.length > 0 && <h3>O que ela precisa hoje</h3>}
            {ficha.alertas.map(a => (
              <div key={a.codigo} className="alerta">
                <span className={`ponto ${a.prioridade}`} />
                <div>
                  <b>{a.titulo}</b>
                  <p>{a.mensagem}</p>
                  {podeResolver(a) && (
                    <button className="btn peq" onClick={() => aoLancar(a.resolve_com, a.contexto)}>
                      Lançar {EVENTOS[a.resolve_com!]?.nome.toLowerCase()}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {ficha.eventos.length > 0 && <h3>Últimos eventos</h3>}
            {ficha.eventos.slice(0, 4).map(ev => (
              <div key={ev.id} className="evento"><span>{ev.tipo_nome}</span><span>{formatarData(ev.data)}</span></div>
            ))}
          </>
        )}

        <div className="acoes">
          <button className="btn sec" onClick={aoFechar}>Voltar ao pasto</button>
          {ficha && tipos.length > 0 && <button className="btn" onClick={() => aoLancar(null)}>Lançar evento</button>}
        </div>
      </div>
    </div>
  );
};

const CartaoQuadro: React.FC<{ alertas: AlertaDoDia[]; aoSeguir: (animalId: number) => void; aoFechar: () => void }> = ({ alertas, aoSeguir, aoFechar }) => (
  <div className="fundo-cartao" onClick={aoFechar}>
    <div className="cartao painel" onClick={ev => ev.stopPropagation()}>
      <h2>Quadro de avisos</h2>
      <p className="mb-2">Calculado do histórico de cada animal. Escolha uma tarefa e siga a seta até ele.</p>
      {alertas.length === 0 && <p>Tudo em dia por aqui!</p>}
      {alertas.map(a => (
        <div key={`${a.animal.id}-${a.codigo}`} className="alerta">
          <span className={`ponto ${a.prioridade}`} />
          <div style={{ flex: 1 }}>
            <b>{a.titulo} · {a.animal.nome || `nº ${a.animal.brinco}`}</b>
            <p>{a.mensagem}</p>
          </div>
          <button className="btn peq" onClick={() => aoSeguir(a.animal.id)}>Ir</button>
        </div>
      ))}
      <div className="acoes"><button className="btn sec" onClick={aoFechar}>Fechar</button></div>
    </div>
  </div>
);

const CartaoSede: React.FC<{ fazenda: string; animais: AnimalResumo[]; alertas: number; aoFechar: () => void }> = ({ fazenda, animais, alertas, aoFechar }) => (
  <div className="fundo-cartao" onClick={aoFechar}>
    <div className="cartao painel" onClick={ev => ev.stopPropagation()}>
      <h2>Sede · {fazenda}</h2>
      <p>{animais.length} animais no rebanho e {alertas} tarefas para hoje.</p>
      <div className="dados">
        {PIQUETES_INFO.map(q => <Dado key={q.id} rotulo={q.nome} valor={`${animais.filter(a => q.categorias.includes(a.categoria || '')).length} animais`} />)}
      </div>
      <div className="acoes">
        <button className="btn sec" onClick={aoFechar}>Voltar ao pasto</button>
        <a className="btn" href="/">Abrir o sistema completo</a>
      </div>
    </div>
  </div>
);

// Um lançamento de controle leiteiro por vaca, com a mesma API da ficha. O backend aceita dois no mesmo dia,
// então quem já tem lançamento na data fica travada: evita leite em dobro.
const ROTULOS_ORDENHA = ['Manhã', 'Tarde', 'Noite'];

const CartaoOrdenha: React.FC<{
  fazendaId: number; funcionarioId?: number; vacas: AnimalResumo[];
  aoLancar: (lancadas: { id: number; litros: number; antes: Alerta[]; depois: Alerta[] }[]) => void;
  aoFechar: () => void;
}> = ({ fazendaId, funcionarioId, vacas, aoLancar, aoFechar }) => {
  const [fichas, setFichas] = useState<Record<number, FichaAnimal> | null>(null);
  const [dataLancamento, setDataLancamento] = useState(hojeISO());
  const [ordenhas, setOrdenhas] = useState(2);
  const [valores, setValores] = useState<Record<number, string[]>>({});
  const [erros, setErros] = useState<Record<number, string>>({});
  const [enviando, setEnviando] = useState<{ feitas: number; total: number } | null>(null);

  useEffect(() => {
    Promise.all(vacas.map(v => api.obterAnimal(fazendaId, v.id, funcionarioId)))
      .then(lista => setFichas(Object.fromEntries(lista.map(f => [f.animal.id, f]))))
      .catch((e) => { toast.error(e.message); aoFechar(); });
  }, []);

  const jaLancado = (id: number) => !!fichas?.[id]?.eventos.some(e => e.tipo === 'controle_leiteiro' && e.data === dataLancamento);
  const litrosDe = (id: number) => (valores[id] || []).slice(0, ordenhas).map(paraNumero).filter((n): n is number => n !== null);
  const invalido = (texto?: string) => !!texto?.trim() && (paraNumero(texto) === null || paraNumero(texto)! < 0 || paraNumero(texto)! > 100);
  const temInvalido = vacas.some(v => !jaLancado(v.id) && (valores[v.id] || []).slice(0, ordenhas).some(invalido));
  const prontas = vacas.filter(v => !jaLancado(v.id) && litrosDe(v.id).length > 0);
  const total = prontas.reduce((s, v) => s + litrosDe(v.id).reduce((a, b) => a + b, 0), 0);

  const mudar = (id: number, i: number, texto: string) => setValores((atual) => {
    const lista = [...(atual[id] || [])];
    lista[i] = texto;
    return { ...atual, [id]: lista };
  });

  // Enter pula para o próximo campo: dá para digitar a ordenha inteira sem usar o mouse
  const proximoCampo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const campos = [...document.querySelectorAll<HTMLInputElement>('.ordenha-campo:not(:disabled)')];
    campos[campos.indexOf(e.currentTarget) + 1]?.focus();
  };

  const lancar = async () => {
    setErros({});
    setEnviando({ feitas: 0, total: prontas.length });
    const lancadas: { id: number; litros: number; antes: Alerta[]; depois: Alerta[] }[] = [];
    const novosErros: Record<number, string> = {};
    const novasFichas = { ...fichas };
    for (const [i, v] of prontas.entries()) {
      const litros = litrosDe(v.id);
      try {
        const r = await api.lancarEvento(fazendaId, v.id, { tipo: 'controle_leiteiro', data: dataLancamento, dados: { ordenhas: litros }, funcionario_id: funcionarioId });
        lancadas.push({ id: v.id, litros: litros.reduce((a, b) => a + b, 0), antes: fichas![v.id].alertas, depois: r.ficha.alertas });
        novasFichas[v.id] = r.ficha;
      } catch (e: any) {
        novosErros[v.id] = e.message;
      }
      setEnviando({ feitas: i + 1, total: prontas.length });
    }
    setFichas(novasFichas);
    setErros(novosErros);
    setEnviando(null);
    if (lancadas.length) aoLancar(lancadas);
    if (Object.keys(novosErros).length === 0) aoFechar();
    else toast.error('Algumas vacas não foram lançadas. Confira os avisos.');
  };

  return (
    <div className="fundo-cartao">
      <div className="cartao painel cartao-largo">
        <h2>Sala de ordenha</h2>
        <p className="mb-2">Digite os litros e aperte Enter para ir à próxima. Vaca em branco fica de fora.</p>
        <div className="ordenha-opcoes">
          <label>Data <input type="date" className="campo" value={dataLancamento} max={hojeISO()} onChange={e => setDataLancamento(e.target.value)} /></label>
          <label>Ordenhas por dia
            <select className="campo" value={ordenhas} onChange={e => setOrdenhas(Number(e.target.value))}>
              {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        {!fichas && <p className="mt-3">Buscando as vacas...</p>}
        {fichas && vacas.length === 0 && <p className="mt-3">Nenhuma vaca em lactação agora.</p>}
        {fichas && vacas.map((v, idxVaca) => {
          const f = fichas[v.id];
          const travada = jaLancado(v.id);
          return (
            <div key={v.id} className={`ordenha-linha ${travada ? 'travada' : ''}`}>
              <div className="ordenha-vaca">
                <b>{v.nome || `Nº ${v.brinco}`}</b>
                <small>{travada ? 'Já lançada nesta data' : f?.estado.media_litros_dia != null ? `Média ${f.estado.media_litros_dia.toFixed(1)} L/dia` : `Brinco ${v.brinco}`}</small>
              </div>
              <div className="ordenha-campos">
                {Array.from({ length: ordenhas }, (_, i) => (
                  <input key={i} className={`campo ordenha-campo ${invalido(valores[v.id]?.[i]) ? 'errado' : ''}`} inputMode="decimal" placeholder={ROTULOS_ORDENHA[i]}
                    aria-label={`${v.nome || v.brinco}: ${ROTULOS_ORDENHA[i]}`} autoFocus={idxVaca === 0 && i === 0} disabled={travada || !!enviando}
                    value={travada ? '' : valores[v.id]?.[i] || ''} onChange={e => mudar(v.id, i, e.target.value)} onKeyDown={proximoCampo} />
                ))}
              </div>
              {erros[v.id] && <p className="ordenha-erro">{erros[v.id]}</p>}
            </div>
          );
        })}
        {temInvalido && <p className="ordenha-erro">Confira os campos em vermelho: use um valor entre 0 e 100 litros.</p>}

        <div className="acoes ordenha-rodape">
          <span className="ordenha-total">{prontas.length} {prontas.length === 1 ? 'vaca' : 'vacas'} · {total.toLocaleString('pt-BR')} L</span>
          <button className="btn sec" onClick={aoFechar} disabled={!!enviando}>Voltar</button>
          <button className="btn" onClick={lancar} disabled={!!enviando || !prontas.length || temInvalido}>
            {enviando ? `Lançando ${enviando.feitas} de ${enviando.total}...` : 'Lançar leite'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartaoLavoura: React.FC<{
  plantacoes: Plantacao[]; podeEditar: boolean; aoNova: () => void;
  aoCorrigir: (p: Plantacao) => void; aoColher: (p: Plantacao) => void; aoFechar: () => void;
}> = ({ plantacoes, podeEditar, aoNova, aoCorrigir, aoColher, aoFechar }) => {
  const noCampo = plantacoes.filter(p => !p.data_colheita);
  const colhidas = plantacoes.filter(p => p.data_colheita).slice(0, 3);
  return (
    <div className="fundo-cartao" onClick={aoFechar}>
      <div className="cartao painel" onClick={ev => ev.stopPropagation()}>
        <h2>Plantação</h2>
        {noCampo.length === 0 && <p className="mt-2">{podeEditar ? 'A fazenda tem plantação? Registre o plantio e ele aparece aqui no sítio, crescendo até o ponto de corte.' : 'Nada plantado no momento.'}</p>}
        {noCampo.map(p => (
          <div key={p.id} className="alerta lavoura-item">
            <div style={{ flex: 1 }}>
              <b>{p.nome}{areaNoJogo(p.hectares)}</b>
              {p.progresso !== null && <div className="barra-xp lavoura-barra"><div style={{ width: `${p.progresso * 100}%` }} /></div>}
              <p>{prazoDaPlantacao(p)} · plantio em {formatarData(p.data_plantio)}</p>
              {podeEditar && (
                <div className="lavoura-botoes">
                  <button className="btn peq sec" onClick={() => aoCorrigir(p)}>Corrigir</button>
                  <button className="btn peq" onClick={() => aoColher(p)}>Colher</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {colhidas.length > 0 && <h3>Colheitas anteriores</h3>}
        {colhidas.map(c => (
          <div key={c.id} className="evento"><span>{c.nome}{areaNoJogo(c.hectares)}{c.toneladas != null ? ` · ${c.toneladas.toLocaleString('pt-BR')} t` : ''}</span><span>{formatarData(c.data_colheita)}</span></div>
        ))}
        <div className="acoes">
          <button className="btn sec" onClick={aoFechar}>Voltar</button>
          {podeEditar && <button className="btn" onClick={aoNova}>Nova plantação</button>}
        </div>
      </div>
    </div>
  );
};

// Painel do modo de edição: o que não dá para fazer arrastando no mapa
const PainelEdicao: React.FC<{
  layout: Layout; selecionado: IdElemento | null; podeDesfazer: boolean; salvando: boolean; motor: Motor | null;
  aoAplicar: (novo: Layout, selecionar?: IdElemento | null) => void; aoDesfazer: () => void; aoSalvar: () => void; aoCancelar: () => void;
}> = ({ layout, selecionado, podeDesfazer, salvando, motor, aoAplicar, aoDesfazer, aoSalvar, aoCancelar }) => {
  const problemas = useMemo(() => problemasDoMapa(layout), [layout]);
  const [novoEnfeite, setNovoEnfeite] = useState<TipoEnfeite>('ipeA');
  const r = selecionado ? retanguloDe(layout, selecionado) : null;
  const piquete = selecionado?.startsWith('piquete:') ? layout.piquetes.find(q => `piquete:${q.id}` === selecionado) : null;
  const centro = () => motor?.centroDaTela() || { x: 25, y: 20 };

  const adicionar = (res: { layout: Layout; id: IdElemento }) => aoAplicar(res.layout, res.id);
  const restaurar = () => {
    if (window.confirm('Voltar ao mapa padrão do jogo? Ainda dá para cancelar depois, antes de salvar.')) aoAplicar(LAYOUT_PADRAO, null);
  };

  return (
    <div className="editor painel">
      <h2>Editar fazenda</h2>
      <p className="editor-dica">Arraste para mover. Bolinhas brancas mudam o tamanho. Arraste o fundo para andar pelo mapa.</p>

      {problemas.length > 0 && (
        <ul className="editor-problemas">
          {problemas.slice(0, 4).map(p => <li key={p}>{p}</li>)}
          {problemas.length > 4 && <li>E mais {problemas.length - 4}.</li>}
        </ul>
      )}

      {selecionado && r ? (
        <div className="editor-bloco">
          <b>{nomeDe(layout, selecionado)}</b>
          {limitesDe(selecionado) && <small>{r.w} × {r.h} ladrilhos</small>}
          {piquete && (
            <div className="editor-campos">
              <label>Porteira
                <select className="campo" value={piquete.lado} onChange={e => aoAplicar(mudarPorteira(layout, piquete.id, { lado: e.target.value as typeof piquete.lado }))}>
                  {LADOS.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </label>
              <label>Posição da porteira
                <input type="range" min={1} max={((piquete.lado === 'y+' || piquete.lado === 'y-') ? piquete.w : piquete.h) - 3}
                  value={ladrilhoDaPorta(piquete)} onChange={e => aoAplicar(mudarPorteira(layout, piquete.id, { porta: Number(e.target.value) }))} />
              </label>
            </div>
          )}
          {podeRemover(selecionado) && <button className="btn sec peq" onClick={() => aoAplicar(removerElemento(layout, selecionado), null)}>Remover</button>}
        </div>
      ) : <p className="editor-dica">Clique em algo no mapa para selecionar.</p>}

      <div className="editor-bloco">
        <b>Adicionar</b>
        <div className="editor-linha">
          <button className="btn sec peq" disabled={layout.estradas.length >= MAX_ESTRADAS} onClick={() => adicionar(adicionarEstrada(layout, centro()))}>Estrada</button>
        </div>
        <div className="editor-linha">
          <select className="campo" value={novoEnfeite} onChange={e => setNovoEnfeite(e.target.value as TipoEnfeite)}>
            {(Object.keys(ENFEITES_INFO) as TipoEnfeite[]).map(t => <option key={t} value={t}>{ENFEITES_INFO[t].nome}</option>)}
          </select>
          <button className="btn sec peq" disabled={layout.enfeites.length >= MAX_ENFEITES} onClick={() => adicionar(adicionarEnfeite(layout, novoEnfeite, centro()))}>Adicionar</button>
        </div>
      </div>

      <div className="editor-linha">
        <button className="btn sec peq" aria-label="Aproximar" onClick={() => motor?.ajustarZoom(1.25)}>+</button>
        <button className="btn sec peq" aria-label="Afastar" onClick={() => motor?.ajustarZoom(0.8)}>−</button>
        <button className="btn sec peq" disabled={!podeDesfazer} onClick={aoDesfazer}>Desfazer</button>
        <button className="btn sec peq" onClick={restaurar}>Mapa padrão</button>
      </div>

      <div className="acoes">
        <button className="btn sec" onClick={aoCancelar}>Cancelar</button>
        <button className="btn" disabled={salvando || problemas.length > 0} onClick={aoSalvar}>{salvando ? 'Salvando...' : 'Salvar mapa'}</button>
      </div>
    </div>
  );
};

// Posição atual da porteira, já ajustada ao tamanho do piquete
const ladrilhoDaPorta = (q: Layout['piquetes'][number]) => {
  const [a] = ladrilhosDaPorteira(q);
  return q.lado === 'y+' || q.lado === 'y-' ? a.x - q.x : a.y - q.y;
};
