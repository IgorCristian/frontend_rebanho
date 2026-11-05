// Textos dos pontos de interrogação (componente Ajuda, em components/ui.tsx).
// Ficam todos aqui para facilitar a revisão. Regras: backend_rebanho/motor e PROJETO.md.

export interface TextoAjuda {
  titulo: string;
  texto: string;
}

export const AJUDA = {
  // ---------- Entrada ----------
  login: {
    titulo: 'Qual acesso usar?',
    texto: 'Consultor / equipe: consultor, veterinário/produtor e inseminador entram com e-mail e senha próprios.\n\nFuncionário: quem trabalha no curral entra com o código da fazenda e o PIN, passados pelo consultor, e depois escolhe o próprio nome.',
  },
  fazendas: {
    titulo: 'Fazendas',
    texto: 'Aqui aparecem as fazendas a que você tem acesso. O consultor vê todas as suas; os demais usuários só veem aquelas em que foram incluídos. Toque em uma fazenda para entrar.',
  },
  quemEVoce: {
    titulo: 'Por que escolher o nome?',
    texto: 'Todos os funcionários entram com o mesmo código e PIN. O nome escolhido fica registrado em cada lançamento ("por Maria"), e você pode corrigir ou excluir os seus próprios lançamentos.',
  },

  // ---------- Páginas ----------
  alertas: {
    titulo: 'Alertas do dia',
    texto: 'Lista do que precisa ser feito hoje, calculada a partir dos lançamentos de cada animal e dos parâmetros da fazenda.\n\nUrgente, Atenção e Lembrete indicam a prioridade. Toque no animal para abrir a ficha e lançar o que resolve o alerta: ao lançar, ele some sozinho.',
  },
  animais: {
    titulo: 'Animais',
    texto: 'Todos os animais da fazenda. Busque pelo brinco ou pelo nome, ou filtre pela categoria.\n\nO selo colorido mostra o alerta mais urgente do animal (+2 quer dizer que há mais dois). "Ver baixados" mostra os animais vendidos ou mortos.',
  },
  saidaLeite: {
    titulo: 'Saída de leite',
    texto: 'Registre aqui, todo dia, o total de leite que o caminhão recolheu na fazenda. No fim do mês, compare o total com a folha do leite do laticínio, que é a base do pagamento.\n\nÉ um registro de um total por dia, separado do controle leiteiro, que mede quanto cada vaca produziu. Os dois números podem ser diferentes, porque nem todo leite produzido vai para o caminhão.',
  },
  litrosSaida: {
    titulo: 'Litros',
    texto: 'Total que o caminhão recolheu neste dia. Se escolher um dia já registrado, o valor aparece preenchido para você corrigir.',
  },
  totalSaida: {
    titulo: 'Total do mês',
    texto: 'Soma dos registros deste mês. Compare com a quantidade da folha do leite.\n\nSe não bater, confira primeiro os dias sem registro e depois a lista dia a dia.',
  },
  plantacoes: {
    titulo: 'Plantações',
    texto: 'O que a fazenda plantou: área, data do plantio e quando cortar. Ao colher, registre as toneladas para ver quanto rendeu por hectare.\n\nCom a fazenda vinculada ao Gestão Fácil, as plantações são as mesmas lavouras da tela de Produção de lá: criar, alterar ou colher em um lugar aparece no outro. Plantação com lançamentos no Gestão só pode ser excluída por lá.\n\nPara milho, sorgo e capim, a previsão de corte é uma conta aproximada pelo ciclo da cultura e pode ser ajustada.',
  },
  lotes: {
    titulo: 'Lotes',
    texto: 'Grupos de manejo ou de dieta, como Alta produção ou Pré-parto. São opcionais, e o sistema só avisa sobre lote para as vacas que estão produzindo leite.\n\nO animal entra em um lote pelo cadastro ou pelos lançamentos de Troca de lote e Entrada no pré-parto. Lotes não são excluídos, só desativados, porque o histórico aponta para eles.',
  },

  // ---------- Resultados ----------
  indicadores: {
    titulo: 'Indicadores',
    texto: 'Mostram o desempenho do rebanho comparado à meta da fazenda.\n\nDentro da meta: atingiu o valor.\nPerto: até 10% pior que a meta (na taxa de descarte, até 40% de diferença).\nFora: mais longe que isso.\n\nReprodução, mortalidade, 1º parto e descarte olham os últimos 12 meses; mastite e leite descartado, os últimos 30 dias.',
  },
  controleLeiteiro: {
    titulo: 'Controle leiteiro',
    texto: 'Reúne os controles lançados no período escolhido. Cada linha traz as ordenhas e a soma do dia, e o resumo mostra a média diária de cada animal.\n\nO botão Excel (CSV) baixa o relatório para abrir em uma planilha.',
  },
  dietas: {
    titulo: 'Dietas por lote',
    texto: 'O consultor escolhe os insumos do estoque do cliente vinculado no Gestão Fácil e informa só quantos kg cada animal come por dia.\n\nO consumo e o custo do lote são calculados com os animais que estão nele hoje. É preciso ter lotes cadastrados e a fazenda vinculada ao Gestão.',
  },
  insumos: {
    titulo: 'Insumos e preço',
    texto: 'Junta os insumos de todas as dietas: preço no Gestão Fácil, consumo, custo por dia e por mês e por quantos dias o estoque dura.\n\nSe o Gestão estiver fora do ar, o consumo continua aparecendo, sem os custos.',
  },
  resumoLote: {
    titulo: 'Resumo do lote',
    texto: 'Mostra quanto cada lote come, custa, produz e quanto sobra de dinheiro. Os valores são de hoje, pelos animais que estão em cada lote e pela média dos últimos controles leiteiros. Mês = 30 dias.',
  },
  precoInsumo: {
    titulo: 'Preço no Gestão',
    texto: 'Custo médio do estoque (PEPS), igual ao da tela de estoque do Gestão Fácil. Sem estoque, usa o último preço de compra.',
  },
  duraEstoque: {
    titulo: 'Dura',
    texto: 'Estoque atual em kg dividido pelo consumo diário de todos os lotes.\n\nVermelho: menos de 7 dias. Amarelo: menos de 15 dias.',
  },
  produzLote: {
    titulo: 'Produz',
    texto: 'Soma da média de leite das vacas do lote, em litros por dia. O leite vendável desconta as vacas em carência e as recém-paridas ainda no período de colostro (P18).',
  },
  sobraLote: {
    titulo: 'Sobra',
    texto: 'Sobra de dinheiro por dia: leite vendável × preço do leite (P32) − custo da dieta. É a receita menos a comida; não inclui outros custos da fazenda.',
  },
  dietaPorLitro: {
    titulo: 'Dieta por litro',
    texto: 'Custo da dieta do lote dividido pelos litros produzidos. Mostra quanto se gasta com comida para produzir 1 litro. Compare com o preço do leite.',
  },
  kgPorUnidade: {
    titulo: 'kg em 1 unidade',
    texto: 'O estoque do Gestão pode estar em saco, balde etc. Informe quantos kg tem 1 unidade para o sistema converter preço e estoque. Em KG e TON a conversão é automática.',
  },

  // ---------- Configurações ----------
  informacoes: {
    titulo: 'Informações da fazenda',
    texto: 'Dados de cadastro da fazenda. A raça predominante é definida na aba Parâmetros. Desativar a fazenda impede o acesso de toda a equipe.',
  },
  parametros: {
    titulo: 'Parâmetros',
    texto: 'Prazos e limites que o sistema usa para calcular categorias, previsões e alertas. Mudar um parâmetro muda o cálculo de todos os animais da fazenda.\n\nCada um mostra a faixa de referência e o valor padrão da planilha. "Ajustado" indica que ele foi alterado, e a seta volta ao padrão.',
  },
  preencherRaca: {
    titulo: 'Pré-preencher pela raça',
    texto: 'Aplica de uma vez os valores de referência da raça escolhida, como peso adulto, idade de 1ª cobertura e duração da gestação. Depois você ainda pode ajustar cada parâmetro.',
  },
  calendario: {
    titulo: 'Calendário sanitário',
    texto: 'Vacinas e controles de parasitas da fazenda. Um item só gera alerta se tiver idade ou intervalo; sem isso, fica apenas informativo.\n\nAo lançar a vacinação ligada ao item, o alerta some. Itens não são excluídos, só desativados.',
  },
  quandoAvisar: {
    titulo: 'Quando avisar',
    texto: 'A partir de: idade em que o alerta começa.\nAté: idade em que para de avisar.\nRepetir a cada: intervalo até a próxima dose.\n\nExemplo da brucelose: começa na idade do P29 e para aos 8 meses, porque a vacina só pode ser dada até essa idade.',
  },
  metas: {
    titulo: 'Metas',
    texto: 'Valor que a fazenda quer atingir em cada indicador. É com ele que Resultados → Indicadores diz se o resultado está dentro, perto ou fora da meta. Os valores padrão vêm da planilha.',
  },
  equipe: {
    titulo: 'Equipe',
    texto: 'Quem trabalha na fazenda.\n\nConsultor e admin: lançam tudo e configuram.\nVeterinário/produtor: lança quase tudo, menos cadastro, compra, reclassificação e venda.\nInseminador e funcionários: lançam o dia a dia.',
  },
  funcionarios: {
    titulo: 'Funcionários',
    texto: 'Não têm conta própria: entram com o código da fazenda e o PIN (aba Acesso) e escolhem o próprio nome nesta lista. Quando alguém sair da fazenda, desative; o nome continua no histórico.',
  },
  usuariosLogin: {
    titulo: 'Usuários com login',
    texto: 'Veterinário/produtor e inseminador têm e-mail e senha próprios e só veem as fazendas em que foram incluídos. Tirar a pessoa da fazenda não apaga a conta dela.',
  },
  acesso: {
    titulo: 'Acesso dos funcionários',
    texto: 'Passe o código da fazenda e o PIN para a equipe. Quem entra com eles vê os alertas e o rebanho e lança o dia a dia.\n\nO acesso só fica ligado depois de definir um PIN.',
  },
  codigoFazenda: {
    titulo: 'Código da fazenda',
    texto: 'Identifica a fazenda na tela de entrada do funcionário. Gerar um novo código faz o antigo parar de funcionar, e será preciso passar o novo para a equipe.',
  },
  pin: {
    titulo: 'PIN',
    texto: 'Senha numérica de 4 a 6 dígitos, a mesma para todos os funcionários da fazenda. Trocar o PIN obriga todos a entrar de novo.',
  },
  integracao: {
    titulo: 'Integração com o Gestão Fácil',
    texto: 'Liga a fazenda a um cliente do Gestão Fácil.\n\nVendas e compras de animais com valor vão para o financeiro do Gestão como pendentes, e quem cuida do financeiro dá baixa por lá. Do Gestão vêm os insumos e custos usados nas dietas.\n\nAo vincular, o que já foi lançado também é enviado.',
  },
  sincronizar: {
    titulo: 'Sincronizar agora',
    texto: 'Se o Gestão estiver fora do ar, os lançamentos ficam aguardando e são enviados no próximo envio. Este botão tenta enviar agora. Venda ou compra já paga no Gestão só pode ser excluída aqui depois de estornada lá.',
  },
  consultores: {
    titulo: 'Consultores',
    texto: 'Contas dos consultores da consultoria. Só o admin cria e desativa. Cada consultor cuida das próprias fazendas e inclui a equipe de cada uma.',
  },

  // ---------- Ficha do animal ----------
  categoria: {
    titulo: 'Categoria',
    texto: 'A categoria nunca é digitada: é calculada a partir dos lançamentos do animal. Por exemplo, o parto faz a vaca virar recém-parida, e a secagem faz ela virar seca.\n\nSe estiver errada, confira o histórico. Só em casos especiais o consultor lança uma Reclassificação.',
  },
  historico: {
    titulo: 'Histórico',
    texto: 'Tudo o que foi lançado para o animal, com a data e quem lançou. É dele que o sistema calcula categoria, previsões e alertas.\n\nO lápis corrige e a lixeira exclui um lançamento; depois disso, tudo é recalculado. Um lançamento que deixaria os seguintes sem sentido é recusado.',
  },
  lancarEvento: {
    titulo: 'Lançar evento',
    texto: 'Registre o que aconteceu com o animal. Só aparecem os eventos que se aplicam à categoria dele e que o seu acesso permite.\n\nSe algo não fizer sentido, o sistema recusa e explica. Se merecer atenção, aceita com um aviso.',
  },
  corrigirCadastro: {
    titulo: 'Corrigir cadastro',
    texto: 'Corrige erros de identificação do animal. A alteração fica no histórico, com o antes e o depois.\n\nSexo e origem não podem ser corrigidos. Se o cadastro foi feito por engano, use "Excluir cadastro" no fim da ficha.',
  },
  situacao: {
    titulo: 'Situação reprodutiva',
    texto: 'Não coberta: ainda sem inseminação neste ciclo.\nAguardando diagnóstico: inseminada, sem resultado.\nPrenha: tem prenhez confirmada.\nVazia: o diagnóstico deu negativo.',
  },
  iasNoCiclo: {
    titulo: 'IAs no ciclo',
    texto: 'IA é inseminação artificial. Este número mostra quantas foram feitas desde o último parto. Ao chegar no limite do P16 sem prenhez, a vaca vira candidata a descarte.',
  },
  partoPrevisto: {
    titulo: 'Parto previsto',
    texto: 'Data da inseminação que resultou em prenhez + duração da gestação (P13).',
  },
  prePartoPrevisto: {
    titulo: 'Entrada no pré-parto',
    texto: 'Parto previsto menos os dias de pré-parto: P14 para vacas e P15 para novilhas.',
  },
  secagemPrevista: {
    titulo: 'Secagem prevista',
    texto: 'Parto previsto menos os dias de secagem (P24). É o dia de parar de ordenhar para a vaca descansar antes do próximo parto.',
  },
  diasEmAberto: {
    titulo: 'Dias em aberto',
    texto: 'Dias entre o último parto e a nova prenhez. Se ela ainda não está prenha, a conta vai até hoje. Quanto menos dias, melhor.',
  },
  del: {
    titulo: 'DEL – dias em lactação',
    texto: 'Dias desde o último parto. Define a fase da lactação:\n\nRecém-parida: até o P17.\nInicial (pico): até o P21.\nIntermediária: até o P22.\nFinal: depois disso.',
  },
  mediaLeite: {
    titulo: 'Média de leite',
    texto: 'Média dos 3 últimos controles leiteiros da vaca, em litros por dia.',
  },
  producaoLactacao: {
    titulo: 'Produção na lactação',
    texto: 'Estimativa dos litros produzidos desde o parto. Entre um controle e outro, o sistema considera que a produção variou de forma gradual. Quanto mais controles lançados, mais próximo do real.',
  },
  producao305: {
    titulo: 'Produção em 305 dias',
    texto: 'Litros nos primeiros 305 dias de lactação, para comparar vacas na mesma base. Só aparece quando a vaca completa 305 dias; se secar antes, vale o total que ela produziu. Não há projeção.',
  },
  iep: {
    titulo: 'Intervalo entre partos',
    texto: 'Dias entre os dois últimos partos. Quanto mais perto de 1 ano, melhor costuma ser a eficiência reprodutiva.',
  },
  gmd: {
    titulo: 'Ganho médio diário',
    texto: 'Diferença de peso entre as duas últimas pesagens dividida pelos dias entre elas. O peso ao nascer conta como a primeira pesagem.',
  },
  pctPesoAdulto: {
    titulo: '% do peso adulto',
    texto: 'Último peso dividido pelo peso adulto da raça (P05). Ajuda a saber se a novilha já tem tamanho para a 1ª cobertura (P06).',
  },
  criteriosCobertura: {
    titulo: 'Critérios de cobertura',
    texto: 'Atingidos quando a novilha tem a idade mínima (P07) e o peso mínimo (P05 × P06). Depois disso, o veterinário ainda precisa aprovar na Avaliação de aptidão: a mudança para novilha apta não é automática.',
  },
  prazoAptidao: {
    titulo: 'Prazo de aptidão',
    texto: 'Data em que o veterinário espera que a novilha esteja apta. Quando vence, aparece o alerta para avaliar. Se a avaliação reprovar, o prazo é adiado e o atraso fica registrado.',
  },
  carencia: {
    titulo: 'Carência do leite',
    texto: 'Até esta data, o leite não pode ir para o tanque por causa do tratamento lançado. Separe e descarte esse leite.',
  },
  escore: {
    titulo: 'Escore corporal',
    texto: 'Nota de 1 a 5 para a condição corporal da vaca, sendo 1 muito magra e 5 muito gorda.',
  },
  mastite: {
    titulo: 'Mastite na lactação',
    texto: 'Casos de mastite lançados desde o último parto. Ao chegar no limite do P31, a vaca vira candidata a descarte.',
  },
  candidataDescarte: {
    titulo: 'Candidata a descarte',
    texto: 'O sistema sugere descarte quando há IAs demais sem prenhez (P16), DEL alto e vazia (P26), produção abaixo do mínimo (P25) ou mastite repetida (P31).\n\nÉ só uma sugestão: quem decide lança "Marcar para descarte".',
  },

  // ---------- Novo animal ----------
  grauSangue: {
    titulo: 'Grau de sangue',
    texto: 'Diz quanto do animal é de cada raça, em animais mestiços como o Girolando, que é o cruzamento de Holandês com Gir.\n\nExemplo: 3/4 Holandês e 1/4 Gir quer dizer que, de cada 4 partes, 3 são de Holandês e 1 é de Gir.\n\nMuita gente escreve isso de forma curta, como "3/4 HG": HG é Holandês com Gir, e o número mostra a parte de Holandês.\n\nÉ opcional. Em animal de raça pura, ou se não souber, deixe em branco.',
  },
  categoriaAtual: {
    titulo: 'Categoria atual',
    texto: 'Só no cadastro você informa como o animal está hoje. Daí em diante, a categoria é calculada pelos lançamentos.',
  },
  dataEstimada: {
    titulo: 'Data de nascimento',
    texto: 'O sistema confere se a data faz sentido com os partos e as IAs informados. Marque "Data estimada" quando não souber a data certa: essa conferência deixa de ser feita.',
  },
  situacaoConhecida: {
    titulo: 'Situação reprodutiva conhecida',
    texto: 'Informe o que já se sabe do animal antes do cadastro, como partos, IA e prenhez. Isso permite calcular previsões e alertas desde o primeiro dia.',
  },
  valorCompra: {
    titulo: 'Compra de animal',
    texto: 'Com valor informado, a compra vai para o financeiro do Gestão Fácil como despesa pendente, se a fazenda estiver vinculada.',
  },
} satisfies Record<string, TextoAjuda>;

// Indicadores (códigos de backend_rebanho/indicadores_catalogo.py): o que é, por que importa e o que olhar se estiver fora da meta.
// A aba INDICADORES da planilha é a fonte. "Como é calculado" e os números da fazenda são somados na tela.
export const AJUDA_INDICADOR: Record<string, string> = {
  IEP: 'Quantos dias se passam, em média, de um parto até o parto seguinte da mesma vaca. É o principal indicador da reprodução: cada dia acima da meta é tempo de vaca seca ou em fim de lactação, produzindo menos.\n\nSe estiver alto: veja os Dias em aberto e a Taxa de prenhez, que mostram onde a vaca está demorando.\n\nSó aparece com vacas que têm pelo menos 2 partos conhecidos.',
  DIAS_ABERTO: 'Quantos dias a vaca leva do parto até emprenhar de novo. Somando a gestação, dá o intervalo entre partos.\n\nConta só as vacas que já estão prenhas, então vacas vazias há muito tempo ainda não pesam aqui. Para acompanhá-las, olhe os alertas "Vaca problema".\n\nSe estiver alto: confira se as vacas estão sendo inseminadas logo depois do período de espera (P19).',
  SERVICOS_CONCEPCAO: 'Quantas inseminações são gastas, em média, para conseguir uma prenhez. Quanto maior, mais se gasta com sêmen e mais tempo a vaca fica vazia.\n\nSe estiver alto: avalie a detecção do cio, o momento da inseminação, a qualidade do sêmen e a saúde reprodutiva.',
  TAXA_SERVICO: 'De cada 100 vacas e novilhas aptas e vazias, quantas foram inseminadas no último ciclo de 21 dias. Mostra se o cio está sendo notado e se as vacas estão sendo inseminadas.\n\nA vaca inseminada antes desse período sai da conta se o diagnóstico depois confirmar a prenhez, porque ela já estava prenha.\n\nSe estiver baixa: reforce a observação de cio ou avalie a IATF, a inseminação em dia marcado.\n\nComo olha só os últimos 21 dias, pode mudar bastante de uma semana para outra, principalmente em rebanho pequeno.',
  TAXA_CONCEPCAO: 'De cada 100 inseminações, quantas resultaram em prenhez. Mostra a qualidade da inseminação, do sêmen e da saúde reprodutiva.\n\nDepende do diagnóstico lançado: inseminação recente sem diagnóstico ainda conta como uma tentativa sem prenhez, então o número pode subir depois.',
  TAXA_PRENHEZ: 'Resume a reprodução em um número: de cada 100 vacas aptas, quantas emprenham a cada 21 dias. É a taxa de serviço multiplicada pela taxa de concepção.\n\nSe estiver baixa: veja qual das duas está puxando para baixo. Serviço baixo indica cio não notado; concepção baixa indica inseminação que não pega.',
  TAXA_ABORTO: 'De cada 100 prenhezes confirmadas, quantas foram perdidas. Considera os abortos lançados e as reconfirmações que deram negativo.\n\nSe estiver acima da meta: investigue doenças reprodutivas com o veterinário.',
  MORTALIDADE_BEZERRAS: 'De cada 100 bezerros nascidos vivos, quantos morreram ainda em aleitamento. Mede a qualidade do manejo da cria.\n\nSe estiver alta: confira a colostragem nas primeiras horas, a higiene e a alimentação.',
  GMD_RECRIA: 'Quantos quilos as novilhas da recria ganham por dia, em média, entre as duas últimas pesagens. Recria bem feita faz a novilha parir mais cedo.\n\nSe estiver baixo: avalie a dieta e a saúde. Só entra quem tem pelo menos duas pesagens, ou o peso ao nascer e uma pesagem, por isso pese com frequência.',
  IDADE_PRIMEIRO_PARTO: 'Com quantos meses, em média, a novilha teve a primeira cria. Mede a eficiência da recria: cada mês a mais é custo sem receita.\n\nConta só os primeiros partos dos últimos 12 meses e usa a data de nascimento do cadastro. Um resultado muito alto pode ser data de nascimento errada, então confira a ficha antes de concluir.\n\nSe estiver alto de fato: veja o ganho de peso da recria e a idade da 1ª cobertura (P07).',
  PCT_LACTACAO: 'De todas as vacas que já pariram, quantas estão sendo ordenhadas. Um rebanho bem manejado tem cerca de 5 de cada 6 vacas em lactação.\n\nSe estiver baixo: há muitas vacas secas, o que costuma vir de intervalo entre partos longo.',
  DEL_MEDIO: 'Em média, há quantos dias as vacas ordenhadas pariram. DEL quer dizer dias em lactação.\n\nSe estiver alto: as vacas estão demorando para parir de novo, o que costuma indicar um problema na reprodução e reduz a produção do rebanho.',
  PRODUCAO_VACA: 'Quantos litros por dia cada vaca em lactação produz, em média. Usa a média dos 3 últimos controles leiteiros de cada vaca.\n\nA meta depende da genética e da dieta da fazenda, então ajuste em Configurações → Metas. Se os controles estiverem atrasados, o número pode não refletir o momento atual.',
  PRODUCAO_305: 'Quanto a vaca produz nos primeiros 305 dias de lactação. Serve para comparar vacas e lactações na mesma base.\n\nSó aparece quando a vaca completa 305 dias ou é secada antes, então fica "sem dados" até haver uma lactação encerrada ou completa com controles lançados.',
  TAXA_DESCARTE: 'De cada 100 vacas, quantas saíram do rebanho no último ano, por venda ou morte. Mostra a renovação do rebanho.\n\nAqui o bom é ficar perto da meta: muito alta é perda de animais, e muito baixa pode ser vaca improdutiva ficando na fazenda.',
  MASTITE_CLINICA: 'De cada 100 vacas em lactação, quantos casos de mastite clínica houve nos últimos 30 dias. A mastite afeta a produção, o leite descartado e a qualidade do leite.\n\nConta só os lançamentos de Mastite do tipo clínica. Se estiver alta: revise a rotina e a higiene da ordenha com o veterinário.',
  LEITE_DESCARTADO: 'De todo o leite produzido nos últimos 30 dias, quanto foi perdido por carência de tratamento. É perda direta de receita.\n\nÉ uma estimativa: dias em carência × média de litros da vaca. Para ela funcionar, informe a carência do leite ao lançar o Tratamento.',
};

// Grupos de parâmetros (título vem do backend: parametros_padrao.py)
export const AJUDA_GRUPO_PARAMETRO: Record<string, string> = {
  'Bezerras e recria': 'Definem quando desmamar e pesar e quando a novilha tem idade e peso para a 1ª cobertura.',
  'Reprodução': 'Definem os prazos de cio, diagnóstico, gestação e pré-parto e o limite de IAs antes de sugerir descarte.',
  'Lactação e secagem': 'Definem as fases da lactação (em DEL), quando inseminar de novo, quando secar e a produção mínima que compensa.',
  'Manejo geral': 'Definem o destino do bezerro macho, a idade do alerta da brucelose e o intervalo do controle leiteiro.',
  'Saúde': 'Define quantos casos de mastite na mesma lactação tornam a vaca candidata a descarte.',
  'Financeiro': 'Preço pago pelo laticínio, em R$/L. É usado na receita e na sobra do Resumo do lote.',
};

// Alertas (códigos de backend_rebanho/motor/alertas.py): quando aparecem e o que os resolve
export const AJUDA_ALERTA: Record<string, string> = {
  COLOSTRAGEM_PENDENTE: 'Animal nascido na fazenda sem colostragem registrada. Resolve com o lançamento de Colostragem.',
  DESMAMAR: 'Bezerra, ou macho com destino Recria (P27), que atingiu a idade de desmama (P01). Confira se come o mínimo de concentrado (P02) pelos dias seguidos pedidos (P03). Resolve com Desmama.',
  VENDER_BEZERRO: 'Macho com destino Venda (P27) que atingiu a idade de venda (P28). Resolve com Venda.',
  PESAR: 'Bezerra, recria ou garrote sem pesagem ou com a última há mais tempo que o intervalo (P04). Resolve com Pesagem.',
  APTA_REPRODUCAO: 'Venceu o prazo dado pelo veterinário ou, sem prazo, a novilha atingiu idade e peso de cobertura. Resolve com Avaliação de aptidão.',
  APTIDAO_ATRASADA: 'A novilha foi reprovada em avaliação de aptidão e o prazo foi adiado. Mostra o atraso acumulado até ela ser aprovada.',
  OBSERVAR_CIO: 'Novilha apta ou vaca em lactação que não está prenha, perto de 21 dias (P09, com a tolerância do P10) depois da última IA ou cio. Se notar o cio, lance Cio observado.',
  FAZER_DIAGNOSTICO: 'Já passou o prazo depois da IA (P11) e ainda não há diagnóstico. Resolve com Diagnóstico de prenhez.',
  RECONFIRMAR_PRENHEZ: 'Já passou o prazo depois da concepção (P12) e só há um diagnóstico. Resolve com Reconfirmação de prenhez.',
  REPETIR_IA: 'O último diagnóstico deu negativo. Resolve com nova Inseminação.',
  APTA_IA_PEV: 'PEV é o período voluntário de espera (P19): o descanso do útero depois do parto, antes de inseminar de novo. A vaca terminou esse período e ainda não foi inseminada. Resolve com Inseminação.',
  VACA_PROBLEMA: 'A vaca passou da meta de DEL para estar prenha (P20) e continua sem prenhez. Avalie com o veterinário.',
  MOVER_PRE_PARTO: 'Chegou o prazo antes do parto previsto: P14 para vacas secas e P15 para novilhas. Resolve com Entrada no pré-parto.',
  PARTO_PROXIMO: 'Animal no pré-parto com parto previsto para os próximos 7 dias. Resolve com Parto.',
  PARTO_ATRASADO: 'O parto previsto já passou e nenhum parto foi lançado. Confira o animal e, se ele já pariu, lance o Parto.',
  LEITE_LIBERADO: 'Terminou hoje o período de colostro (P18): o leite pode ir para o tanque. Não precisa lançar nada; o aviso aparece só neste dia.',
  FIM_POS_PARTO: 'A vaca está em lactação e não trocou de lote desde o parto. Resolve com Troca de lote.',
  SECAR: 'Chegou o prazo de secagem antes do parto previsto (P24). Resolve com Secagem.',
  BAIXA_PRODUCAO: 'A média de leite está abaixo da produção mínima econômica (P25). Avalie secar a vaca; resolve com Secagem ou quando a média subir.',
  PESAR_LEITE: 'O último controle leiteiro, ou o parto, foi há mais tempo que o intervalo (P30). Resolve com Controle leiteiro.',
  LEITE_EM_CARENCIA: 'A vaca está em tratamento com carência: separe e descarte o leite. O aviso some sozinho quando a carência termina.',
  CANDIDATA_DESCARTE: 'O sistema encontrou motivo para sugerir descarte; a mensagem diz qual. Quem decide lança "Marcar para descarte".',
  VACINA_PENDENTE: 'O calendário sanitário indica que esta vacina ou este controle está na hora. Resolve ao lançar a aplicação ligada ao item do calendário.',
  SEM_LOTE: 'A fazenda usa lotes e esta vaca, que está produzindo leite, não está em nenhum. Resolve com Troca de lote. Animais que não estão produzindo, como bezerros, não geram este aviso.',
};
