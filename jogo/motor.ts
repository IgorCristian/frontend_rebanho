// Motor do jogo: mapa, personagem, animais e desenho isométrico. Não fala com a API:
// o JogoApp entrega os animais (setAnimais) e recebe as interações pelos avisos.
// A lógica (colisão, rotas, distâncias) segue no plano do mapa, em unidades (16 = 1 ladrilho); só o desenho é isométrico.
import { AlertaResumo, AnimalResumo } from '../types';
import {
  Cultura, Porte, Sprite, criarArbusto, criarArvore, criarCasinha, criarCerca, criarCocho, criarFeno, criarOrdenha, criarPedra,
  criarPersonagem, criarPlaca, criarPlanta, criarPorteira, criarQuadro, criarSede, criarVaca, pelagemDa, pintarLadrilho, projetar, sorteador,
} from './arte';
import {
  ALTURA, LADRILHO, LARGURA, LAYOUT_PADRAO, Layout, Mundo, Piquete, Ponto, Prop, Retangulo, caminho, construirMundo, ladrilhoLivre, piqueteDaCategoria,
} from './mapa';
import { IdElemento, aplicarRetangulo, limitesDe, retanguloDe } from './editor';

export type AlvoInteracao =
  | { tipo: 'animal'; id: number; nome: string }
  | { tipo: 'porteira' | 'quadro' | 'sede' | 'ordenha' | 'lavoura'; nome: string };

export interface LavouraVisivel { cultura: Cultura; rotulo: string; progresso: number }

export interface AvisosMotor {
  aoInteragir: (alvo: AlvoInteracao) => void;
  aoMudarProximo: (alvo: AlvoInteracao | null) => void;
  aoAndar: () => void;
  aoSelecionar?: (id: IdElemento | null) => void;     // modo de edição
  aoEditar?: (novo: Layout) => void;
}

// O que está sendo arrastado no modo de edição
interface Arrasto {
  modo: 'mover' | 'canto' | 'camera';
  id?: IdElemento;
  canto?: number;           // 0 a 3: esquerda, baixo, direita, topo do losango
  origem: Retangulo | null;
  inicio: Ponto;            // ladrilho onde o arrasto começou
  telaInicio: Ponto;
  camInicio: Ponto;
  atual: Retangulo | null;
}

interface Bicho {
  id: number;
  dados: AnimalResumo;
  piquete: Piquete;
  x: number; // em unidades do mundo
  y: number;
  vaiEmbora: boolean;
  rota: Ponto[];
  destino: Ponto | null;
  espera: number;
  pastando: boolean;
  dir: number; // 0 a 7, de 45 em 45 graus
  tempoPasso: number;
  fala: { texto: string; t: number } | null;
  sprites: Map<string, Sprite>;
  porte: Porte;
}

// Tudo o que tem altura entra na ordenação por profundidade, com a área que ocupa no chão
interface Item { x0: number; x1: number; y0: number; y1: number; desenhar: () => void }
interface TextoFlutuante { x: number; y: number; texto: string; cor: string; t: number }
interface Confete { x: number; y: number; vx: number; vy: number; cor: string; t: number }

const TAMANHO = LADRILHO;
const VELOCIDADE = 75; // unidades do mundo por segundo
const ALCANCE = TAMANHO * 2.1;
const COR_PRIORIDADE: Record<string, string> = { alta: '#e5484d', media: '#e8a317', baixa: '#3b8ed0' };
const FONTE = 'Nunito, system-ui, sans-serif';
const PRETO_PAINEL = 'rgba(14, 20, 16, .82)';

const emUnidades = (p: Ponto) => ({ x: p.x * TAMANHO, y: p.y * TAMANHO });
const direcaoDe = (dx: number, dy: number) => (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;

export const porteDoAnimal = (categoria: string | null): Porte =>
  (categoria === 'BZF' || categoria === 'BZM' ? 'cria' : categoria === 'TOR' || categoria === 'GAR' ? 'touro' : 'adulta');

// Quem está na frente? Primeiro pela área no chão (vale para casas grandes); se não decidir, pela soma x + y
const compararProfundidade = (a: Item, b: Item) => {
  const aAtras = a.x1 <= b.x0 || a.y1 <= b.y0;
  const bAtras = b.x1 <= a.x0 || b.y1 <= a.y0;
  if (aAtras !== bAtras) return aAtras ? -1 : 1;
  return a.x0 + a.x1 + a.y0 + a.y1 - (b.x0 + b.x1 + b.y0 + b.y1);
};

export class Motor {
  private ctx: CanvasRenderingContext2D;
  private mundo: Mundo;
  private chao: HTMLCanvasElement;
  private chaoOrigem: { x: number; y: number; res: number };
  private arado: { c: HTMLCanvasElement; x: number; y: number };
  private spritesProps: Partial<Record<string, Sprite[]>> = {};
  private jogadorSprites = new Map<string, Sprite>();
  private aguas: Ponto[] = [];
  private lavoura: LavouraVisivel | null = null;
  private plantas = new Map<string, Sprite>();

  private x = 0;
  private y = 0;
  private editando = false;
  private selecionado: IdElemento | null = null;
  private arrasto: Arrasto | null = null;
  private zoomEdicao = 0.5;
  private camEdicao: Ponto = { x: 0, y: 0 };
  private dir = 1;
  private tempoPasso = 0;
  private andando = false;
  private teclas = new Set<string>();

  private bichos = new Map<number, Bicho>();
  private saindo: Bicho[] = [];
  private primeiraCarga = true;
  private textos: TextoFlutuante[] = [];
  private confetes: Confete[] = [];
  private alvoId: number | null = null;
  private proximo: AlvoInteracao | null = null;

  private pausado = false;
  private rodando = true;
  private ultimoTempo = 0;
  private tempo = 0;
  private escalaJogo = 1;
  private camX = 0;
  private camY = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private andou = false;

  constructor(private canvas: HTMLCanvasElement, private avisos: AvisosMotor) {
    this.ctx = canvas.getContext('2d')!;
    this.mundo = construirMundo(LAYOUT_PADRAO);
    const pintado = this.pintarChao();
    this.chao = pintado.c;
    this.chaoOrigem = pintado;
    this.arado = this.pintarArado();
    this.prepararSprites();
    this.posicionarJogador();
    window.addEventListener('keydown', this.teclaDesce);
    window.addEventListener('keyup', this.teclaSobe);
    window.addEventListener('blur', this.soltarTudo);
    window.addEventListener('resize', this.ajustarTela);
    canvas.addEventListener('pointerdown', this.ponteiroDesce);
    canvas.addEventListener('pointermove', this.ponteiroMove);
    canvas.addEventListener('pointerup', this.ponteiroSobe);
    canvas.addEventListener('pointercancel', this.ponteiroSobe);
    canvas.addEventListener('wheel', this.rodinha, { passive: false });
    this.ajustarTela();
    requestAnimationFrame(this.quadro);
  }

  destruir() {
    this.rodando = false;
    window.removeEventListener('keydown', this.teclaDesce);
    window.removeEventListener('keyup', this.teclaSobe);
    window.removeEventListener('blur', this.soltarTudo);
    window.removeEventListener('resize', this.ajustarTela);
    this.canvas.removeEventListener('pointerdown', this.ponteiroDesce);
    this.canvas.removeEventListener('pointermove', this.ponteiroMove);
    this.canvas.removeEventListener('pointerup', this.ponteiroSobe);
    this.canvas.removeEventListener('pointercancel', this.ponteiroSobe);
    this.canvas.removeEventListener('wheel', this.rodinha);
  }

  // Troca o mapa: repinta o chão, refaz as construções e reacomoda quem ficou em lugar que não existe mais
  setLayout(layout: Layout) {
    if (layout === this.mundo.layout) return;
    this.mundo = construirMundo(layout);
    this.aguas = [];
    const pintado = this.pintarChao();
    this.chao = pintado.c;
    this.chaoOrigem = pintado;
    this.arado = this.pintarArado();
    this.prepararSprites();
    this.bichos.forEach((b) => {
      b.piquete = this.mundo.piquetes.find(q => q.id === b.piquete.id)!;
      b.rota = [];
      b.destino = null;
      const i = b.piquete.interno;
      const fora = b.x / TAMANHO < i.x || b.x / TAMANHO > i.x + i.w || b.y / TAMANHO < i.y || b.y / TAMANHO > i.y + i.h;
      if (fora) {
        const p = this.pontoNoPiquete(b.piquete);
        b.x = p.x;
        b.y = p.y;
      }
    });
    if (this.bate(this.x, this.y)) this.posicionarJogador();
  }

  private posicionarJogador() {
    const { portaSede } = this.mundo.pontos;
    const p = ladrilhoLivre(this.mundo, { x: portaSede.x, y: portaSede.y + 3 });
    this.x = (p.x + 0.5) * TAMANHO;
    this.y = (p.y + 0.5) * TAMANHO;
  }

  // Ponto livre dentro do piquete, em unidades do mundo
  private pontoNoPiquete(q: Piquete, sorte: () => number = Math.random) {
    const i = q.interno;
    for (let t = 0; t < 12; t++) {
      const x = i.x + sorte() * i.w, y = i.y + sorte() * i.h;
      if (!this.mundo.solido[Math.floor(y)]?.[Math.floor(x)]) return emUnidades({ x, y });
    }
    return emUnidades(ladrilhoLivre(this.mundo, { x: i.x + i.w / 2, y: i.y + i.h / 2 }));
  }

  private rotaAte(b: { x: number; y: number }, destino: { x: number; y: number }) {
    return caminho(this.mundo, { x: b.x / TAMANHO, y: b.y / TAMANHO }, { x: destino.x / TAMANHO, y: destino.y / TAMANHO });
  }

  // ---------- Comandos do React ----------

  setPausado(p: boolean) {
    this.pausado = p;
    if (p) this.teclas.clear();
  }

  // Sem plantação, a área fica só no capim com a placa
  setLavoura(l: LavouraVisivel | null) {
    this.lavoura = l;
  }

  setAlvo(id: number | null) {
    this.alvoId = id;
  }

  // Direcional na tela do celular
  pressionar(tecla: string, descer: boolean) {
    if (descer) this.teclas.add(tecla);
    else this.teclas.delete(tecla);
  }

  acionar() {
    if (!this.pausado && !this.editando && this.proximo) this.avisos.aoInteragir(this.proximo);
  }

  // Compara com o que já está em campo: animal novo entra, quem mudou de categoria anda até o piquete novo, quem saiu vai embora
  setAnimais(animais: AnimalResumo[]) {
    const vistos = new Set<number>();
    animais.forEach((a) => {
      vistos.add(a.id);
      const atual = this.bichos.get(a.id);
      if (!atual) {
        this.bichos.set(a.id, this.novoBicho(a));
        return;
      }
      const piqueteNovo = piqueteDaCategoria(this.mundo, a.categoria);
      const mudouVisual = atual.dados.categoria !== a.categoria || atual.dados.situacao_reprodutiva !== a.situacao_reprodutiva;
      atual.dados = a;
      if (mudouVisual) {
        atual.sprites.clear();
        atual.porte = porteDoAnimal(a.categoria);
      }
      if (piqueteNovo.id !== atual.piquete.id) {
        atual.rota = this.rotaAte(atual, this.pontoNoPiquete(piqueteNovo));
        atual.piquete = piqueteNovo;
        atual.destino = null;
        atual.espera = 0;
        atual.pastando = false;
        this.flutuar(atual.x, atual.y, `Indo para: ${piqueteNovo.nome}`, '#fff');
      }
    });
    this.bichos.forEach((b, id) => {
      if (vistos.has(id)) return;
      b.vaiEmbora = true;
      b.rota = this.rotaAte(b, emUnidades(this.mundo.pontos.entrada));
      b.destino = null;
      b.pastando = false;
      this.flutuar(b.x, b.y, 'Saindo do rebanho', '#fff');
      this.saindo.push(b);
      this.bichos.delete(id);
    });
    this.primeiraCarga = false;
  }

  private novoBicho(a: AnimalResumo): Bicho {
    const piquete = piqueteDaCategoria(this.mundo, a.categoria);
    const sorte = sorteador(a.id);
    let pos = this.pontoNoPiquete(piquete, sorte);
    let rotaNova: Ponto[] = [];
    if (!this.primeiraCarga) {
      const mae = a.mae ? this.bichos.get(a.mae.id) : null;
      if (mae) {
        // Cria nasce do lado da mãe e vai para o bezerreiro
        pos = { x: mae.x + 18, y: mae.y + 4 };
        rotaNova = this.rotaAte(pos, this.pontoNoPiquete(piquete));
      } else {
        // Compra ou cadastro: entra pela porteira do sítio
        pos = emUnidades(this.mundo.pontos.entrada);
        rotaNova = this.rotaAte(pos, this.pontoNoPiquete(piquete));
      }
      this.flutuar(pos.x, pos.y, a.nome ? `Chegou: ${a.nome}!` : `Chegou: nº ${a.brinco}!`, '#ffe27a');
      this.soltarConfete(pos.x, pos.y);
    }
    return {
      id: a.id, dados: a, piquete, x: pos.x, y: pos.y, vaiEmbora: false, rota: rotaNova, destino: null,
      espera: sorte() * 3, pastando: sorte() > 0.5, dir: Math.floor(sorte() * 8), tempoPasso: 0, fala: null, sprites: new Map(), porte: porteDoAnimal(a.categoria),
    };
  }

  // Comemoração depois de um lançamento
  comemorar(id: number, texto: string, cor = '#ffe27a') {
    const b = this.bichos.get(id);
    const x = b ? b.x : this.x, y = b ? b.y : this.y;
    this.flutuar(x, y, texto, cor);
    this.soltarConfete(x, y);
  }

  // Vaca responde quando o personagem chega para conversar
  falar(id: number, texto = 'Muuu!') {
    const b = this.bichos.get(id);
    if (!b) return;
    b.fala = { texto, t: 2.2 };
    b.dir = direcaoDe(this.x - b.x, this.y - b.y);
    b.pastando = false;
    b.destino = null;
    b.espera = 3;
  }

  // Usado nos testes da tela
  posicao() {
    return { x: this.x, y: this.y, bichos: [...this.bichos.values()].map(b => ({ id: b.id, x: b.x, y: b.y, rota: b.rota.length, piquete: b.piquete.id })), saindo: this.saindo.length };
  }

  irPara(x: number, y: number) {
    this.x = x * TAMANHO;
    this.y = y * TAMANHO;
  }

  // ---------- Entrada ----------

  private teclaDesce = (e: KeyboardEvent) => {
    if (this.pausado && !this.editando) return;
    const alvo = e.target as HTMLElement | null;
    if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
    const tecla = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(tecla)) {
      this.teclas.add(tecla);
      e.preventDefault();
    } else if (tecla === 'e' || tecla === ' ' || tecla === 'enter') {
      if (!e.repeat) this.acionar();
      e.preventDefault();
    }
  };

  private teclaSobe = (e: KeyboardEvent) => this.teclas.delete(e.key.toLowerCase());
  private soltarTudo = () => this.teclas.clear();

  private ajustarTela = () => {
    this.dpr = window.devicePixelRatio || 1;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.escalaJogo = this.w < 700 ? 0.8 : this.w < 1300 ? 0.95 : 1.15;
  };

  // ---------- Preparação ----------

  private pintarChao() {
    const res = window.innerWidth < 700 ? 1 : 1.5;
    const margem = 40;
    const lX = LARGURA * TAMANHO, lY = ALTURA * TAMANHO;
    const x = -lY * 2 - margem, y = -margem;
    const c = document.createElement('canvas');
    c.width = Math.ceil(((lX + lY) * 2 + margem * 2) * res);
    c.height = Math.ceil((lX + lY + margem * 2) * res);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(res, 0, 0, res, -x * res, -y * res);
    const sorte = sorteador(2026);
    const { chao } = this.mundo;
    // Os ladrilhos de cada tipo vão por cima dos vizinhos com sobra: desenha do fundo para a frente
    for (let soma = 0; soma < LARGURA + ALTURA; soma++) {
      for (let ty = 0; ty < ALTURA; ty++) {
        const tx = soma - ty;
        if (tx < 0 || tx >= LARGURA) continue;
        pintarLadrilho(ctx, tx * TAMANHO, ty * TAMANHO, chao[ty][tx], sorte);
        if (chao[ty][tx] === 'agua') this.aguas.push({ x: tx, y: ty });
      }
    }
    // Margens irregulares: a estrada e a água "comem" um pouco o capim, para não parecer quadriculado
    for (let ty = 0; ty < ALTURA; ty++) {
      for (let tx = 0; tx < LARGURA; tx++) {
        const t = chao[ty][tx];
        if (t !== 'terra' && t !== 'agua') continue;
        const cor = t === 'terra' ? '#7c4e34' : '#a89a70';
        ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).forEach(([dx, dy]) => {
          const v = chao[ty + dy]?.[tx + dx];
          if (v === t || v === undefined || (t === 'agua' && v === 'terra')) return;
          for (let i = 0; i < 12; i++) {
            const s = sorte() * 16;
            const ux = tx * TAMANHO + (dx === 0 ? s : dx > 0 ? 16 : 0), uy = ty * TAMANHO + (dy === 0 ? s : dy > 0 ? 16 : 0);
            const [px, py] = projetar(ux, uy);
            ctx.fillStyle = cor;
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.ellipse(px, py, 2.5 + sorte() * 4, 1.2 + sorte() * 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
        // Rastros de pneu e de casco na estrada
        if (t === 'terra' && sorte() < 0.5) {
          const [px, py] = projetar(tx * TAMANHO + 8, ty * TAMANHO + 8);
          ctx.fillStyle = 'rgba(70,42,26,.28)';
          ctx.beginPath();
          ctx.ellipse(px + (sorte() - 0.5) * 30, py + (sorte() - 0.5) * 14, 5 + sorte() * 8, 1 + sorte() * 1.5, 0.46, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    return { c, x, y, res };
  }

  private pintarArado() {
    const res = 1.5, l = this.mundo.lavoura;
    const [ax] = projetar(l.x * TAMANHO, (l.y + l.h) * TAMANHO);
    const [bx] = projetar((l.x + l.w) * TAMANHO, l.y * TAMANHO);
    const [, ay] = projetar(l.x * TAMANHO, l.y * TAMANHO);
    const [, by] = projetar((l.x + l.w) * TAMANHO, (l.y + l.h) * TAMANHO);
    const c = document.createElement('canvas');
    c.width = Math.ceil((bx - ax) * res);
    c.height = Math.ceil((by - ay) * res);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(res, 0, 0, res, -ax * res, -ay * res);
    const quad = (x0: number, y0: number, x1: number, y1: number, cor: string) => {
      const pts = [projetar(x0, y0), projetar(x1, y0), projetar(x1, y1), projetar(x0, y1)];
      ctx.fillStyle = cor;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    };
    const x0 = l.x * TAMANHO, x1 = (l.x + l.w) * TAMANHO, y0 = l.y * TAMANHO, y1 = (l.y + l.h) * TAMANHO;
    quad(x0, y0, x1, y1, '#67452d');
    for (let y = y0; y < y1; y += 5.33) {
      quad(x0, y, x1, y + 1.6, '#553824');
      quad(x0, y + 2.4, x1, y + 3.4, '#775238');
    }
    return { c, x: ax, y: ay };
  }

  private prepararSprites() {
    const l = this.mundo.layout;
    this.spritesProps = {
      cerca: Array.from({ length: 16 }, (_, bracos) => criarCerca(bracos)), // a semente do trecho é a combinação de vizinhos
      ipeA: [criarArvore(11, 'amarelo'), criarArvore(23, 'amarelo')], ipeR: [criarArvore(31, 'rosa'), criarArvore(47, 'rosa')],
      arvore: [criarArvore(51, 'verde'), criarArvore(67, 'verde'), criarArvore(83, 'verde')],
      sede: [criarSede(l.sede.w, l.sede.h)], ordenha: [criarOrdenha(l.ordenha.w, l.ordenha.h)], casinha: [criarCasinha()], placa: [criarPlaca()],
      quadro: [criarQuadro()], porteira: [criarPorteira()], feno: [criarFeno()], cocho: [criarCocho()],
      arbusto: [criarArbusto(3), criarArbusto(9)], pedra: [criarPedra()],
    };
  }

  private spriteDoJogador(fase: 0 | 1 | 2 | 3 | 4) {
    const chave = `${this.dir}${fase}`;
    let s = this.jogadorSprites.get(chave);
    if (!s) {
      s = criarPersonagem(this.dir, fase);
      this.jogadorSprites.set(chave, s);
    }
    return s;
  }

  private spriteDoBicho(b: Bicho, passo: 0 | 1 | 2, pastando: boolean) {
    const chave = `${b.dir}${passo}${pastando ? 'p' : ''}`;
    let s = b.sprites.get(chave);
    if (!s) {
      const cat = b.dados.categoria || '';
      s = criarVaca({
        pelagem: pelagemDa(b.dados.raca, b.id), porte: b.porte, semente: b.id, dir: b.dir, passo, pastando,
        ubere: cat === 'LAC' || cat === 'RPA', barriga: cat === 'PRE' || cat === 'NVP' || b.dados.situacao_reprodutiva === 'prenhe',
      });
      b.sprites.set(chave, s);
    }
    return s;
  }

  // ---------- Atualização ----------

  private quadro = (agora: number) => {
    if (!this.rodando) return;
    const dt = Math.min((agora - this.ultimoTempo) / 1000 || 0, 0.05);
    this.ultimoTempo = agora;
    this.tempo += dt;
    if (this.editando) this.moverCamera(dt);
    else if (!this.pausado) this.moverJogador(dt);
    this.bichos.forEach(b => this.moverBicho(b, dt));
    this.afastarBichos(dt);
    this.saindo = this.saindo.filter((b) => {
      this.moverBicho(b, dt);
      return b.rota.length > 0;
    });
    this.atualizarEfeitos(dt);
    this.procurarProximo();
    this.desenhar();
    requestAnimationFrame(this.quadro);
  };

  private bate(x: number, y: number) {
    // Os "pés" do personagem são um quadrado pequeno
    const pontos = [[x - 4, y - 4], [x + 4, y - 4], [x - 4, y + 4], [x + 4, y + 4]];
    return pontos.some(([px, py]) => {
      const tx = Math.floor(px / TAMANHO), ty = Math.floor(py / TAMANHO);
      return ty < 0 || tx < 0 || ty >= ALTURA || tx >= LARGURA || this.mundo.solido[ty][tx];
    });
  }

  private moverJogador(dt: number) {
    const t = this.teclas;
    // As teclas seguem a tela: "cima" anda para o fundo do losango, que é -x -y no mapa
    const cima = t.has('arrowup') || t.has('w'), baixo = t.has('arrowdown') || t.has('s');
    const esq = t.has('arrowleft') || t.has('a'), dir = t.has('arrowright') || t.has('d');
    const telaX = (dir ? 1 : 0) - (esq ? 1 : 0), telaY = (baixo ? 1 : 0) - (cima ? 1 : 0);
    this.andando = telaX !== 0 || telaY !== 0;
    if (!this.andando) return;
    let dx = telaX + telaY, dy = telaY - telaX;
    const norma = Math.hypot(dx, dy);
    dx /= norma;
    dy /= norma;
    this.dir = direcaoDe(dx, dy);
    const nx = this.x + dx * VELOCIDADE * dt;
    const ny = this.y + dy * VELOCIDADE * dt;
    if (!this.bate(nx, this.y)) this.x = nx;
    if (!this.bate(this.x, ny)) this.y = ny;
    this.tempoPasso += dt;
    if (!this.andou) {
      this.andou = true;
      this.avisos.aoAndar();
    }
  }

  private moverBicho(b: Bicho, dt: number) {
    if (b.fala) {
      b.fala.t -= dt;
      if (b.fala.t <= 0) b.fala = null;
    }
    // Animal perto do personagem fica quieto: senão é difícil "alcançar" a vaca certa
    if (b.rota.length === 0 && Math.hypot(b.x - this.x, b.y - this.y) < ALCANCE * 1.4) {
      b.destino = null;
      return;
    }
    if (b.rota.length === 0 && !b.destino) {
      b.espera -= dt;
      if (b.espera > 0) return;
      const r = Math.random();
      if (r < 0.45) {
        b.pastando = !b.pastando;
        b.espera = 2 + Math.random() * 4;
        return;
      }
      b.pastando = false;
      b.destino = this.pontoNoPiquete(b.piquete);
    }
    const alvo = b.rota.length ? emUnidades(b.rota[0]) : b.destino!;
    const dx = alvo.x - b.x, dy = alvo.y - b.y;
    const dist = Math.hypot(dx, dy);
    const veloc = b.rota.length ? 30 : 9;
    if (dist < 2) {
      if (b.rota.length) b.rota.shift();
      else {
        b.destino = null;
        b.espera = 2 + Math.random() * 5;
        b.pastando = Math.random() > 0.4;
      }
      return;
    }
    b.x += (dx / dist) * veloc * dt;
    b.y += (dy / dist) * veloc * dt;
    b.dir = direcaoDe(dx, dy);
    b.tempoPasso += dt * (b.rota.length ? 2.2 : 1);
  }

  // Vacas não ficam uma dentro da outra (quem está em rota passa livre)
  private afastarBichos(dt: number) {
    const lista = [...this.bichos.values()].filter(b => !b.rota.length);
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i], b = lista[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const minimo = a.porte === 'cria' && b.porte === 'cria' ? 14 : 23;
        if (d >= minimo) continue;
        const f = ((minimo - d) / d) * Math.min(1, dt * 2);
        a.x -= dx * f; a.y -= dy * f;
        b.x += dx * f; b.y += dy * f;
      }
    }
  }

  private atualizarEfeitos(dt: number) {
    this.textos = this.textos.filter((t) => {
      t.t -= dt;
      return t.t > 0;
    });
    this.confetes = this.confetes.filter((c) => {
      c.t -= dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 150 * dt;
      return c.t > 0;
    });
  }

  private flutuar(x: number, y: number, texto: string, cor: string) {
    this.textos.push({ x, y, texto, cor, t: 2.6 });
  }

  private soltarConfete(x: number, y: number) {
    const cores = ['#e3bb3a', '#56d699', '#d57fa9', '#fff', '#5a9db5'];
    const [px, py] = projetar(x, y, 18);
    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 70;
      this.confetes.push({ x: px, y: py, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, cor: cores[i % cores.length], t: 0.7 + Math.random() * 0.7 });
    }
  }

  private procurarProximo() {
    let melhor: AlvoInteracao | null = null;
    let menor = ALCANCE;
    // Na porta da ordenha a sala tem preferência: sempre há vaca por perto e ela "roubaria" a interação
    const pts = this.mundo.pontos, LAVOURA = this.mundo.lavoura;
    const porta = emUnidades(pts.portaOrdenha);
    const naPorta = Math.hypot(porta.x - this.x, porta.y - this.y) < TAMANHO * 1.3;
    if (naPorta) melhor = { tipo: 'ordenha', nome: 'Sala de ordenha' };
    else this.bichos.forEach((b) => {
      const d = Math.hypot(b.x - this.x, b.y - this.y);
      if (d < menor) {
        menor = d;
        melhor = { tipo: 'animal', id: b.id, nome: b.dados.nome || `nº ${b.dados.brinco}` };
      }
    });
    if (!melhor) {
      const lugares: [AlvoInteracao, Ponto][] = [
        [{ tipo: 'porteira', nome: 'Porteira de entrada' }, { x: pts.entrada.x, y: pts.entrada.y - 1 }],
        [{ tipo: 'quadro', nome: 'Quadro de avisos' }, pts.frenteQuadro],
        [{ tipo: 'sede', nome: 'Sede' }, pts.portaSede],
        [{ tipo: 'lavoura', nome: 'Plantação' }, { x: pts.placaLavoura.x + 0.5, y: pts.placaLavoura.y + 1.5 }],
      ];
      lugares.forEach(([alvo, p]) => {
        const c = emUnidades(p);
        const d = Math.hypot(c.x - this.x, c.y - this.y);
        if (d < menor) {
          menor = d;
          melhor = alvo;
        }
      });
    }
    // Andando dentro da plantação também dá para abrir
    const tx = this.x / TAMANHO, ty = this.y / TAMANHO;
    if (!melhor && tx >= LAVOURA.x && tx < LAVOURA.x + LAVOURA.w && ty >= LAVOURA.y && ty < LAVOURA.y + LAVOURA.h) {
      melhor = { tipo: 'lavoura', nome: 'Plantação' };
    }
    const chave = (a: AlvoInteracao | null) => (a ? (a.tipo === 'animal' ? `a${a.id}` : a.tipo) : '');
    if (chave(melhor) !== chave(this.proximo)) {
      this.proximo = melhor;
      this.avisos.aoMudarProximo(melhor);
    }
  }

  // ---------- Desenho ----------

  // Mundo → pixels da tela (CSS)
  private naTela(x: number, y: number, z = 0): [number, number] {
    const [px, py] = projetar(x, y, z);
    return [(px - this.camX) * this.escala, (py - this.camY) * this.escala];
  }

  private desenhar() {
    const { ctx, dpr, w, h } = this;
    const escala = this.escala;
    const vw = w / escala, vh = h / escala;
    if (this.editando) {
      this.camX = this.camEdicao.x - vw / 2;
      this.camY = this.camEdicao.y - vh / 2;
    } else {
      const [jx, jy] = projetar(this.x, this.y, 10);
      this.camX = jx - vw / 2;
      this.camY = jy - vh / 2;
    }
    const fator = escala * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#20281c';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(fator, 0, 0, fator, -this.camX * fator, -this.camY * fator);

    const o = this.chaoOrigem;
    ctx.drawImage(this.chao, o.x, o.y, this.chao.width / o.res, this.chao.height / o.res);
    if (this.lavoura) ctx.drawImage(this.arado.c, this.arado.x, this.arado.y, this.arado.c.width / 1.5, this.arado.c.height / 1.5);
    this.desenharAgua();

    const itens = this.montarItens(vw, vh);
    itens.sort(compararProfundidade);
    itens.forEach(i => i.desenhar());

    this.desenharEfeitos();
    this.desenharLuz();
    this.desenharRotulos();
    this.desenharSeta();
    if (this.editando) this.desenharEdicao();
  }

  private montarItens(vw: number, vh: number) {
    const itens: Item[] = [];
    const visivel = (x: number, y: number, m = 260) => {
      const [px, py] = projetar(x, y);
      return px > this.camX - m && px < this.camX + vw + m && py > this.camY - m && py < this.camY + vh + m + 120;
    };
    const area = (r: Retangulo | undefined, x: number, y: number) => (r
      ? { x0: r.x * TAMANHO, x1: (r.x + r.w) * TAMANHO, y0: r.y * TAMANHO, y1: (r.y + r.h) * TAMANHO }
      : { x0: x, x1: x, y0: y, y1: y });
    this.mundo.props.forEach((p) => {
      const px = p.x * TAMANHO, py = p.y * TAMANHO;
      const grande = p.tipo === 'sede' || p.tipo === 'ordenha';
      if (visivel(px, py, grande ? 460 : 260)) itens.push({ ...area(p.solido, px, py), desenhar: () => this.desenharProp(p, px, py) });
    });
    if (this.lavoura) {
      const LAVOURA = this.mundo.lavoura;
      const estagio = this.estagioLavoura();
      for (let ty = 0; ty < LAVOURA.h; ty++) {
        for (let tx = 0; tx < LAVOURA.w; tx++) {
          const cx = (LAVOURA.x + tx + 0.5) * TAMANHO, cy = (LAVOURA.y + ty + 0.5) * TAMANHO;
          if (!visivel(cx, cy, 80)) continue;
          const planta = this.spriteDaPlanta(this.lavoura.cultura, estagio, (tx * 3 + ty * 5) % 3);
          itens.push({ x0: cx - 8, x1: cx + 8, y0: cy - 8, y1: cy + 8, desenhar: () => this.blit(planta, cx, cy) });
        }
      }
    }
    [...this.bichos.values(), ...this.saindo].forEach((b) => {
      if (visivel(b.x, b.y)) itens.push({ x0: b.x, x1: b.x, y0: b.y, y1: b.y, desenhar: () => this.desenharBicho(b) });
    });
    if (!this.editando) itens.push({ x0: this.x, x1: this.x, y0: this.y, y1: this.y, desenhar: () => this.desenharJogador() });
    return itens;
  }

  private estagioLavoura() {
    const p = this.lavoura?.progresso ?? 0;
    return p >= 1 ? 4 : p >= 0.7 ? 3 : p >= 0.35 ? 2 : p >= 0.08 ? 1 : 0;
  }

  private spriteDaPlanta(cultura: Cultura, estagio: number, variante: number) {
    const chave = `${cultura}${estagio}${variante}`;
    let s = this.plantas.get(chave);
    if (!s) {
      s = criarPlanta(cultura, estagio, variante + 1);
      this.plantas.set(chave, s);
    }
    return s;
  }

  private desenharAgua() {
    const { ctx } = this;
    const fase = Math.floor(this.tempo * 1.5);
    ctx.fillStyle = 'rgba(190,225,235,.55)';
    this.aguas.forEach(({ x, y }, i) => {
      if ((i + fase) % 4 !== 0) return;
      const [px, py] = projetar(x * TAMANHO + 8, y * TAMANHO + 8);
      ctx.beginPath();
      ctx.ellipse(px + ((i * 7 + fase * 3) % 22) - 11, py + ((i * 5) % 12) - 6, 5, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private blit(s: Sprite, x: number, y: number) {
    const [px, py] = projetar(x, y);
    this.ctx.drawImage(s.c, px - s.ax, py - s.ay, s.w, s.h);
  }

  private desenharProp(p: Prop, x: number, y: number) {
    const lista = this.spritesProps[p.tipo];
    if (!lista) return;
    const s = lista[(p.semente || 0) % lista.length];
    // Construção ou árvore na frente do personagem fica transparente, para ele não sumir
    const alto = ['sede', 'ordenha', 'ipeA', 'ipeR', 'arvore'].includes(p.tipo);
    if (alto && !this.editando && this.escondeJogador(p, s, x, y)) {
      this.ctx.globalAlpha = 0.34;
      this.blit(s, x, y);
      this.ctx.globalAlpha = 1;
      return;
    }
    this.blit(s, x, y);
  }

  private escondeJogador(p: Prop, s: Sprite, x: number, y: number) {
    const [px, py] = projetar(x, y);
    const [jx, jy] = projetar(this.x, this.y, 12);
    const noRetangulo = jx > px - s.ax + 12 && jx < px - s.ax + s.w - 12 && jy > py - s.ay + 6 && jy < py - s.ay + s.h - 6;
    if (!noRetangulo || !p.solido) return false;
    const x1 = (p.solido.x + p.solido.w) * TAMANHO, y1 = (p.solido.y + p.solido.h) * TAMANHO;
    return this.x < x1 && this.y < y1;
  }

  private desenharBicho(b: Bicho) {
    const movendo = b.rota.length > 0 || !!b.destino;
    const passo: 0 | 1 | 2 = movendo ? ((Math.floor(b.tempoPasso * 6) % 2) + 1) as 1 | 2 : 0;
    const pastando = b.pastando && !movendo;
    this.blit(this.spriteDoBicho(b, passo, pastando), b.x, b.y);
  }

  private desenharJogador() {
    const fase = this.andando ? ((Math.floor(this.tempoPasso * 10) % 4) + 1) as 1 | 2 | 3 | 4 : 0;
    this.blit(this.spriteDoJogador(fase), this.x, this.y);
  }

  private desenharEfeitos() {
    const { ctx } = this;
    this.confetes.forEach((c) => {
      ctx.fillStyle = c.cor;
      ctx.fillRect(c.x, c.y, 2.4, 2.4);
    });
  }

  // O sítio segue a hora de verdade: fim de tarde dourado e noite azulada. As bordas escurecem de leve para dar profundidade
  private desenharLuz() {
    const { ctx } = this;
    const hora = new Date().getHours() + new Date().getMinutes() / 60;
    let cor: string | null = 'rgba(255, 228, 180, .05)';
    if (hora >= 19 || hora < 5.5) cor = 'rgba(14, 24, 66, .38)';
    else if (hora >= 17) cor = 'rgba(232, 120, 50, .17)';
    else if (hora < 7) cor = 'rgba(255, 180, 140, .13)';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const cw = this.canvas.width, ch = this.canvas.height;
    const v = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, cw / 2, ch / 2, Math.max(cw, ch) * 0.78);
    v.addColorStop(0, 'rgba(8,12,8,0)');
    v.addColorStop(1, 'rgba(8,12,8,.52)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, cw, ch);
  }

  // ---------- O que fica por cima de tudo, em pixels da tela: sempre nítido e no mesmo tamanho ----------

  private rotulo(texto: string, cx: number, y: number, fundo = PRETO_PAINEL, cor = '#fff', tam = 13) {
    const { ctx } = this;
    ctx.font = `700 ${tam}px ${FONTE}`;
    const l = ctx.measureText(texto).width + 16, a = tam + 9;
    ctx.fillStyle = fundo;
    ctx.beginPath();
    ctx.roundRect(cx - l / 2, y - a / 2, l, a, a / 2);
    ctx.fill();
    ctx.fillStyle = cor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, cx, y + 0.5);
  }

  private pino(cx: number, y: number, cor: string) {
    const { ctx } = this;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    ctx.moveTo(cx - 4.5, y + 7.5);
    ctx.lineTo(cx, y + 14);
    ctx.lineTo(cx + 4.5, y + 7.5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 13px ${FONTE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, y + 0.5);
  }

  private desenharRotulos() {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const balanco = Math.sin(this.tempo * 4) * 2;

    const contagem: Record<string, number> = {};
    this.bichos.forEach((b) => { contagem[b.piquete.id] = (contagem[b.piquete.id] || 0) + 1; });
    const placa = (texto: string, tx: number, ty: number, z = 20) => {
      const [sx, sy] = this.naTela(tx * TAMANHO, ty * TAMANHO, z);
      if (sx > -160 && sx < this.w + 160 && sy > -40 && sy < this.h + 40) this.rotulo(texto, sx, sy, 'rgba(62, 44, 26, .9)', '#f3ead4', 12);
      return [sx, sy];
    };
    const pts = this.mundo.pontos, ord = this.mundo.layout.ordenha;
    this.mundo.piquetes.forEach(q => placa(`${q.nome} · ${contagem[q.id] || 0}`, q.placa.x + 0.5, q.placa.y + 0.5));
    placa('Porteira de entrada', pts.entrada.x + 0.5, pts.entrada.y + 1.3, 36);
    placa('Quadro de avisos', pts.quadro.x + 0.5, pts.quadro.y + 0.5, 27);
    placa('Ordenha', ord.x + ord.w / 2, ord.y + ord.h / 2, 42);
    const [lx, ly] = placa(this.lavoura?.rotulo || 'Área de plantio', pts.placaLavoura.x + 0.5, pts.placaLavoura.y + 0.5);
    if (this.lavoura && this.lavoura.progresso >= 1) this.pino(lx, ly - 30 + balanco, COR_PRIORIDADE.alta);

    const emFoco = this.proximo?.tipo === 'animal' ? this.proximo.id : null;
    [...this.bichos.values()].forEach((b) => {
      const k = b.porte === 'cria' ? 0.55 : b.porte === 'touro' ? 1 : 0.85;
      const [sx, sy] = this.naTela(b.x, b.y, 26 * k);
      if (sx < -40 || sx > this.w + 40 || sy < -40 || sy > this.h + 40) return;
      const alertas: AlertaResumo[] = b.dados.alertas || [];
      const nomeado = b.id === emFoco || b.id === this.alvoId;
      if (alertas.length && !this.editando) {
        const maior = alertas.find(a => a.prioridade === 'alta') || alertas.find(a => a.prioridade === 'media') || alertas[0];
        this.pino(sx, sy - 20 + balanco - (nomeado ? 24 : 0), COR_PRIORIDADE[maior.prioridade]);
      }
      if (nomeado) this.rotulo(b.dados.nome ? `${b.dados.nome} · ${b.dados.brinco}` : `nº ${b.dados.brinco}`, sx, sy - 16);
      if (b.fala) this.rotulo(b.fala.texto, sx + 36, sy - 44, '#f6efdd', '#2b1d14');
    });

    this.textos.forEach((t) => {
      const [sx, sy] = this.naTela(t.x, t.y, 34);
      ctx.globalAlpha = Math.min(1, t.t);
      this.rotulo(t.texto, sx, sy - (2.6 - t.t) * 16, PRETO_PAINEL, t.cor, 14);
      ctx.globalAlpha = 1;
    });

    if (this.proximo && !this.pausado && !this.editando) {
      // Indicador de "dá para interagir"
      const p = this.posicaoDoProximo();
      if (p) {
        const y = p.y + balanco;
        ctx.fillStyle = '#56d699';
        ctx.beginPath();
        ctx.roundRect(p.x - 11, y - 11, 22, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#0c1a14';
        ctx.font = `800 14px ${FONTE}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', p.x, y + 0.5);
      }
    }
  }

  private posicaoDoProximo(): Ponto | null {
    const a = this.proximo;
    if (!a) return null;
    const emTela = (x: number, y: number, z: number, dx = 0) => {
      const [sx, sy] = this.naTela(x, y, z);
      return { x: sx + dx, y: sy };
    };
    if (a.tipo === 'animal') {
      const b = this.bichos.get(a.id);
      return b ? emTela(b.x, b.y, 26, 44) : null;
    }
    const pts = this.mundo.pontos;
    if (a.tipo === 'quadro') return emTela((pts.quadro.x + 0.5) * TAMANHO, pts.quadro.y * TAMANHO, 40);
    if (a.tipo === 'sede') return emTela(pts.portaSede.x * TAMANHO, (pts.portaSede.y - 0.5) * TAMANHO, 14);
    if (a.tipo === 'ordenha') return emTela(pts.portaOrdenha.x * TAMANHO, (pts.portaOrdenha.y - 0.5) * TAMANHO, 14);
    if (a.tipo === 'lavoura') return emTela(this.x, this.y, 30, 30);
    return emTela((pts.entrada.x + 0.5) * TAMANHO, (pts.entrada.y + 1.3) * TAMANHO, 22);
  }

  // Seta na tela para o animal da tarefa escolhida
  private desenharSeta() {
    if (this.alvoId === null) return;
    const b = this.bichos.get(this.alvoId);
    if (!b) return;
    const { ctx, w, h } = this;
    const [sx, sy] = this.naTela(b.x, b.y, 26);
    const dentro = sx > 50 && sx < w - 50 && sy > 50 && sy < h - 50;
    const balanco = Math.sin(this.tempo * 6) * 5;
    if (dentro) {
      ctx.fillStyle = '#56d699';
      ctx.beginPath();
      const topo = sy - 74 + balanco;
      ctx.moveTo(sx - 12, topo);
      ctx.lineTo(sx + 12, topo);
      ctx.lineTo(sx, topo + 15);
      ctx.closePath();
      ctx.fill();
      return;
    }
    const cx = w / 2, cy = h / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const raio = Math.min((w / 2 - 54) / Math.max(Math.abs(Math.cos(ang)), 0.01), (h / 2 - 54) / Math.max(Math.abs(Math.sin(ang)), 0.01));
    const ax = cx + Math.cos(ang) * (raio + balanco), ay = cy + Math.sin(ang) * (raio + balanco);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = PRETO_PAINEL;
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(-14, -19); ctx.lineTo(-14, 19);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#56d699';
    ctx.beginPath();
    ctx.moveTo(17, 0); ctx.lineTo(-10, -13); ctx.lineTo(-10, 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------- Modo de edição ----------

  private get escala() {
    return this.editando ? this.zoomEdicao : this.escalaJogo;
  }

  setEditando(ativo: boolean) {
    this.editando = ativo;
    this.arrasto = null;
    this.selecionado = null;
    this.teclas.clear();
    if (ativo) {
      // Começa vendo o sítio inteiro
      const lx = LARGURA * TAMANHO, ly = ALTURA * TAMANHO;
      this.camEdicao = { x: lx - ly, y: (lx + ly) / 2 };
      // No celular o painel cobre a parte de baixo: o mapa fica na metade de cima
      const estreita = this.w < 700;
      const alturaUtil = estreita ? this.h * 0.55 : this.h;
      this.zoomEdicao = Math.max(0.2, Math.min(0.9, Math.min(this.w / ((lx + ly) * 2.1), alturaUtil / ((lx + ly) * 1.15))));
      if (estreita) this.camEdicao.y += (this.h * 0.22) / this.zoomEdicao;
    } else if (this.bate(this.x, this.y)) this.posicionarJogador();
  }

  selecionar(id: IdElemento | null) {
    this.selecionado = id;
  }

  ajustarZoom(fator: number) {
    this.zoomEdicao = Math.max(0.2, Math.min(1.4, this.zoomEdicao * fator));
  }

  // Centro do que está na tela, em ladrilhos: é onde entram os elementos novos
  centroDaTela(): Ponto {
    return this.telaParaLadrilho(this.w / 2, this.h / 2);
  }

  private telaParaLadrilho(sx: number, sy: number, z = 0): Ponto {
    const px = sx / this.escala + this.camX, py = sy / this.escala + this.camY + z * 2;
    return { x: (py + px / 2) / 2 / TAMANHO, y: (py - px / 2) / 2 / TAMANHO };
  }

  private moverCamera(dt: number) {
    const t = this.teclas;
    const v = (520 * dt) / this.escala;
    if (t.has('arrowleft') || t.has('a')) this.camEdicao.x -= v;
    if (t.has('arrowright') || t.has('d')) this.camEdicao.x += v;
    if (t.has('arrowup') || t.has('w')) this.camEdicao.y -= v;
    if (t.has('arrowdown') || t.has('s')) this.camEdicao.y += v;
  }

  // Qual elemento está neste ponto da tela? O menor e mais alto ganha do que está por baixo
  private elementoEm(sx: number, sy: number): IdElemento | null {
    const l = this.mundo.layout;
    const contem = (r: Retangulo | null, p: Ponto) => !!r && p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
    const chao = this.telaParaLadrilho(sx, sy);
    // Árvores e construções têm altura: um clique na copa ou no telhado também conta
    const alturas = [0, 8, 16, 24, 32, 40, 50];
    for (let i = l.enfeites.length - 1; i >= 0; i--) {
      const id = `enfeite:${i}`, r = retanguloDe(l, id);
      const alto = ['ipeA', 'ipeR', 'arvore'].includes(l.enfeites[i].tipo);
      if ((alto ? alturas : [0, 8]).some(z => contem(r, this.telaParaLadrilho(sx, sy, z)))) return id;
    }
    for (const id of ['quadro', 'entrada', 'sede', 'ordenha']) {
      if (alturas.some(z => contem(retanguloDe(l, id), this.telaParaLadrilho(sx, sy, z)))) return id;
    }
    for (const q of l.piquetes) {
      // Dentro do piquete vale a estrada que passar por lá? Não: o piquete é o elemento principal
      if (contem(q, chao)) return `piquete:${q.id}`;
    }
    if (contem(l.lavoura, chao)) return 'lavoura';
    if (contem(l.acude, chao)) return 'acude';
    for (let i = l.estradas.length - 1; i >= 0; i--) {
      if (contem(l.estradas[i], chao)) return `estrada:${i}`;
    }
    return null;
  }

  private cantosNaTela(r: Retangulo): [number, number][] {
    const u = TAMANHO;
    // Na tela: topo (x0,y0), direita (x1,y0), baixo (x1,y1), esquerda (x0,y1)
    return [this.naTela(r.x * u, r.y * u), this.naTela((r.x + r.w) * u, r.y * u), this.naTela((r.x + r.w) * u, (r.y + r.h) * u), this.naTela(r.x * u, (r.y + r.h) * u)];
  }

  private ponteiroDesce = (e: PointerEvent) => {
    if (!this.editando) return;
    this.canvas.setPointerCapture(e.pointerId);
    const inicio = this.telaParaLadrilho(e.clientX, e.clientY);
    const base = { telaInicio: { x: e.clientX, y: e.clientY }, camInicio: { ...this.camEdicao }, inicio, atual: null };
    const l = this.mundo.layout;
    // Primeiro os cantos do que já está selecionado
    if (this.selecionado && limitesDe(this.selecionado)) {
      const r = retanguloDe(l, this.selecionado);
      if (r) {
        const canto = this.cantosNaTela(r).findIndex(([cx, cy]) => Math.hypot(cx - e.clientX, cy - e.clientY) < 16);
        if (canto >= 0) {
          this.arrasto = { ...base, modo: 'canto', id: this.selecionado, canto, origem: r };
          return;
        }
      }
    }
    const id = this.elementoEm(e.clientX, e.clientY);
    if (id !== this.selecionado) {
      this.selecionado = id;
      this.avisos.aoSelecionar?.(id);
    }
    this.arrasto = id
      ? { ...base, modo: 'mover', id, origem: retanguloDe(l, id) }
      : { ...base, modo: 'camera', origem: null };
  };

  private ponteiroMove = (e: PointerEvent) => {
    const a = this.arrasto;
    if (!a) return;
    if (a.modo === 'camera') {
      this.camEdicao = { x: a.camInicio.x - (e.clientX - a.telaInicio.x) / this.escala, y: a.camInicio.y - (e.clientY - a.telaInicio.y) / this.escala };
      return;
    }
    const agora = this.telaParaLadrilho(e.clientX, e.clientY);
    const dx = Math.round(agora.x - a.inicio.x), dy = Math.round(agora.y - a.inicio.y);
    const o = a.origem!;
    if (a.modo === 'mover') {
      a.atual = { ...o, x: o.x + dx, y: o.y + dy };
      return;
    }
    const lim = limitesDe(a.id!)!;
    let { x, y, w, h } = o;
    // Cantos: 0 topo (mexe x0,y0), 1 direita (x1,y0), 2 baixo (x1,y1), 3 esquerda (x0,y1)
    if (a.canto === 0 || a.canto === 3) { const novo = Math.max(lim.minW, Math.min(lim.maxW, o.w - dx)); x = o.x + o.w - novo; w = novo; }
    else w = Math.max(lim.minW, Math.min(lim.maxW, o.w + dx));
    if (a.canto === 0 || a.canto === 1) { const novo = Math.max(lim.minH, Math.min(lim.maxH, o.h - dy)); y = o.y + o.h - novo; h = novo; }
    else h = Math.max(lim.minH, Math.min(lim.maxH, o.h + dy));
    a.atual = { x, y, w, h };
  };

  private ponteiroSobe = () => {
    const a = this.arrasto;
    this.arrasto = null;
    if (!a || !a.atual || !a.id || !a.origem) return;
    const o = a.origem, n = a.atual;
    if (o.x === n.x && o.y === n.y && o.w === n.w && o.h === n.h) return;
    this.avisos.aoEditar?.(aplicarRetangulo(this.mundo.layout, a.id, n));
  };

  private rodinha = (e: WheelEvent) => {
    if (!this.editando) return;
    e.preventDefault();
    this.ajustarZoom(e.deltaY < 0 ? 1.12 : 0.89);
  };

  private desenharEdicao() {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const l = this.mundo.layout;
    const contorno = (r: Retangulo, cor: string, fundo: string | null, largura = 2) => {
      const c = this.cantosNaTela(r);
      ctx.beginPath();
      c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      if (fundo) {
        ctx.fillStyle = fundo;
        ctx.fill();
      }
      ctx.strokeStyle = cor;
      ctx.lineWidth = largura;
      ctx.stroke();
    };
    // Grade leve, para mostrar que tudo encaixa nos ladrilhos
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= LARGURA; x++) {
      const [a, b] = [this.naTela(x * TAMANHO, 0), this.naTela(x * TAMANHO, ALTURA * TAMANHO)];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    for (let y = 0; y <= ALTURA; y++) {
      const [a, b] = [this.naTela(0, y * TAMANHO), this.naTela(LARGURA * TAMANHO, y * TAMANHO)];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
    if (!this.selecionado) return;
    const r = this.arrasto?.atual || retanguloDe(l, this.selecionado);
    if (!r) return;
    contorno(r, '#56d699', 'rgba(86,214,153,.2)', 2.5);
    if (limitesDe(this.selecionado) && !this.arrasto?.atual) {
      this.cantosNaTela(r).forEach(([x, y]) => {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#17352a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
    if (this.arrasto?.atual) {
      const [cx, cy] = this.naTela((r.x + r.w / 2) * TAMANHO, (r.y + r.h / 2) * TAMANHO);
      this.rotulo(`${r.w} × ${r.h}`, cx, cy);
    }
  }
}
