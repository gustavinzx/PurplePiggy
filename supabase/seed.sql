-- Default System Categories
insert into categories (user_id, slug, name, icon, color, is_essential, sort_order)
values
  (null, 'moradia', 'Moradia', 'Home', '#432171', true, 1),
  (null, 'alimentacao', 'Alimentação', 'ShoppingCart', '#B037F8', true, 2),
  (null, 'transporte', 'Transporte', 'Bus', '#7D2BD6', true, 3),
  (null, 'saude', 'Saúde', 'HeartPulse', '#E5487A', true, 4),
  (null, 'familia', 'Cuidados com a família', 'Users', '#FF79A8', true, 5),
  (null, 'educacao', 'Educação', 'GraduationCap', '#CF91F6', false, 6),
  (null, 'lazer', 'Lazer', 'Sparkles', '#FEDA70', false, 7),
  (null, 'compras', 'Compras', 'ShoppingBag', '#3B82F6', false, 8),
  (null, 'outros', 'Outros', 'CircleEllipsis', '#7D6A9C', false, 9)
on conflict do nothing;

-- 8 Educational Tracks & Lessons
insert into educational_contents (
  track_slug, track_title, track_description, track_order,
  lesson_slug, lesson_title, summary, body_md, example_md, tip, minutes, lesson_order, icon
) values
-- Trilha 1
(
  'organizacao-financeira', 'Organização financeira', 'Comece a entender seus hábitos.', 1,
  'para-onde-vai-meu-dinheiro', 'Para onde vai meu dinheiro?',
  'O primeiro passo para a liberdade financeira é observar seus gastos sem culpa.',
  'Organizar o dinheiro não é sobre cortar tudo o que traz alegria, mas sobre entender a rota que suas escolhas fazem no dia a dia. Quando você anota o que gasta, ganha clareza e poder de decisão.

Nesta etapa, dividimos seus gastos em três grandes grupos: essenciais (o que mantém a vida funcionando, como moradia, alimentação e saúde), prioridades/metas (seu futuro e tranquilidade) e estilo de vida.

O segredo está em observar por pelo menos uma semana sem julgamento. Não se culpe por nenhum gasto: o objetivo inicial é apenas enxergar a realidade com carinho.',
  'Se você recebe R$ 2.500 por mês e gasta R$ 1.500 com contas essenciais, você tem R$ 1.000 para equilibrar entre cuidar da família, pequenos confortos e construir sua reserva aos poucos.',
  'Anote os gastos na hora em que eles acontecem no PurplePiggy. Em poucos segundos o hábito se consolida!', 5, 1, 'BookOpen'
),
(
  'organizacao-financeira', 'Organização financeira', 'Comece a entender seus hábitos.', 1,
  'montando-primeiro-orcamento', 'Montando seu primeiro orçamento',
  'Aprenda a definir limites realistas respeitando seu ritmo de vida.',
  'Um orçamento realista não é uma camisa de força, mas sim um guia que protege sua tranquilidade. O maior erro é tentar economizar tudo de uma vez ou criar limites que não cabem na sua rotina.

Comece listando sua renda líquida real e os gastos essenciais fixos. O valor restante deve ser dividido de forma que você não termine o mês no aperto e ainda consiga poupar nem que seja R$ 20 ou R$ 50.

Revisar o orçamento a cada mês permite ajustar o plano conforme imprevistos acontecem. Flexibilidade é o que garante a constância.',
  'Em uma renda de R$ 2.500: Moradia (R$ 900), Alimentação (R$ 600), Transporte (R$ 250), Saúde e Família (R$ 350). Sobram R$ 400 para metas e lazer consciente.',
  'Use o botão "Sugerir limites" no PurplePiggy para calcular tetos automáticos baseados nos seus gastos reais.', 6, 2, 'Sliders'
),

-- Trilha 2
(
  'juros-sem-misterio', 'Juros sem mistério', 'Entenda como os juros funcionam.', 2,
  'juros-o-que-sao', 'Juros: o que são?',
  'Uma explicação simples para uma escolha mais consciente.',
  'Juros são valores adicionais cobrados ou recebidos quando uma quantia de dinheiro é emprestada, financiada ou investida ao longo do tempo.

Quando você pega dinheiro emprestado (empréstimo, cartão de crédito parcelado ou cheque especial), você paga juros como compensação pelo tempo que usou aquele recurso.

Quando você guarda dinheiro em uma aplicação segura (como Tesouro Selic ou CDB de liquidez diária), a instituição financeira paga juros para você pelo tempo que o dinheiro ficou aplicado.',
  'Ao pegar R$ 1.000 emprestados a uma taxa de 2% ao mês por 1 mês, você devolverá R$ 1.020. Os R$ 20 a mais são os juros cobrados pelo empréstimo.',
  'Entender a taxa antes de parcelar evita surpresas no final do mês. Pergunte sempre o valor total a prazo!', 5, 1, 'Percent'
),
(
  'juros-sem-misterio', 'Juros sem mistério', 'Entenda como os juros funcionam.', 2,
  'simples-vs-compostos', 'Juros simples vs. compostos',
  'Entenda como o efeito "bola de neve" funciona a seu favor ou contra você.',
  'No regime de juros simples, o percentual é calculado sempre em cima do valor inicial. Já nos juros compostos, o cálculo é feito sobre o valor acumulado mês a mês — o famoso "juros sobre juros".

Quando se trata de dívidas, os juros compostos aceleram o endividamento rapidamente caso a fatura não seja paga integralmente.

Por outro lado, ao poupar e investir para metas de médio e longo prazo, os juros compostos trabalham incansavelmente multiplicando suas economias.',
  'R$ 1.000 a 2% a.m.: no 1º mês rende R$ 20. No 2º mês, rende 2% sobre R$ 1.020 = R$ 20,40. Com o tempo, a curva cresce exponencialmente.',
  'Para guardar, tempo é o seu maior aliado. Comece cedo mesmo com valores pequenos.', 6, 2, 'TrendingUp'
),

-- Trilha 3
(
  'cartao-de-credito', 'Cartão de crédito', 'Use o cartão como aliado, não como armadilha.', 3,
  'como-o-cartao-funciona', 'Como o cartão realmente funciona',
  'Fatura, melhor dia de compra e limite consciente.',
  'O cartão de crédito é apenas um meio de pagamento com prazo estendido: ele não aumenta a sua renda. Cada compra realizada é um compromisso assumido com o seu salário do mês seguinte.

A data de fechamento da fatura define quando as compras serão cobradas. O melhor dia para comprar é logo após o fechamento, pois você ganha até 40 dias para pagar.

Ter um limite alto no banco não significa que você deve usá-lo. O seu limite real de compras deve ser aquele que cabe confortavelmente dentro do seu orçamento mensal.',
  'Se o seu salário é R$ 3.000, um limite bancário de R$ 7.000 pode induzir a gastos que comprometem os próximos meses inteiros. Mantenha os gastos mensais no cartão dentro da sua faixa de segurança.',
  'No PurplePiggy, você pode acompanhar os gastos no cartão em tempo real para não ter sustos no fechamento.', 5, 1, 'CreditCard'
),
(
  'cartao-de-credito', 'Cartão de crédito', 'Use o cartão como aliado, não como armadilha.', 3,
  'perigo-do-rotativo', 'O perigo do pagamento mínimo e do rotativo',
  'Como escapar das taxas mais caras do mercado financeiro.',
  'Segundo dados de 2026, entre as mulheres endividadas no Brasil, 86% possuem pendências com cartão de crédito, na maioria das vezes decorrentes de despesas essenciais como farmácia e supermercado.

Pagar o valor mínimo da fatura joga o saldo restante no chamado "crédito rotativo", onde incidem juros que chegam a ultrapassar 400% ao ano.

Se você perceber que não conseguirá pagar o total da fatura, parcelar a fatura em taxa fixa acordada com o banco é sempre menos danoso do que cair no rotativo automático.',
  'Uma fatura de R$ 1.000 paga pelo mínimo (R$ 150) pode se transformar em mais de R$ 1.300 no mês seguinte devido a juros rotativos e IOF.',
  'Nunca use o rotativo como extensão da renda. Se apertar, priorize os gastos vitais e busque opções com taxas menores.', 7, 2, 'AlertTriangle'
),

-- Trilha 4
(
  'reserva-de-emergencia', 'Reserva de emergência', 'Proteja quem você ama contra imprevistos.', 4,
  'por-que-ter-reserva', 'Por que ter uma reserva financeira?',
  'Apenas 19% das mulheres têm reserva no Brasil (Serasa, 2026). Mude essa estatística.',
  'A vida real é cheia de imprevistos: um cano que estoura, um remédio urgente da mãe, material escolar inesperado ou uma consulta veterinária. Sem reserva, cada imprevisto vira dívida no cartão ou empréstimo com juros altos.

A reserva de emergência é o colchão que amortece o impacto dos acidentes de percurso. Ela não serve para ficar rica, mas para dar paz de espírito e autonomia.

Mulheres que constroem uma reserva tomam decisões mais livres no trabalho e nos relacionamentos, pois sabem que têm uma base segura.',
  'Ter R$ 1.000 guardados evita ter que pagar um conserto emergencial de carro em 10 parcelas com juros de 12% ao mês.',
  'Guarde sua reserva em uma conta separada do dia a dia, com rendimento seguro e liquidez diária (pode sacar quando precisar).', 5, 1, 'ShieldCheck'
),
(
  'reserva-de-emergencia', 'Reserva de emergência', 'Proteja quem você ama contra imprevistos.', 4,
  'comecando-pequeno', 'Começando pequeno: passo a passo',
  'Sua primeira meta: uma semana de gastos essenciais.',
  'Muitos guias recomendam guardar 6 meses de salário logo de início, o que parece inalcançável para quem está com o orçamento apertado. No PurplePiggy, dividimos a meta em degraus gentis.

O primeiro degrau é juntar apenas 1 semana de gastos essenciais (cerca de R$ 300 a R$ 600). Alcançar essa meta rápida traz a sensação gostosa de vitória e motivação.

Depois avançamos para 1 mês de despesas essenciais, depois 3 meses, e finalmente 6 meses. Qualquer R$ 20 depositado é um tijolinho na sua fortaleza.',
  'Se seus gastos essenciais são R$ 2.000 por mês, 1 semana equivale a R$ 500. Guardando R$ 50 por semana, em apenas 10 semanas seu primeiro escudo estará pronto!',
  'Crie a meta "Reserva de Emergência" no app e faça pequenos aportes semanais.', 6, 2, 'Smile'
),

-- Trilha 5
(
  'planejamento-financeiro', 'Planejamento financeiro', 'Construa seus sonhos com constância.', 5,
  'metas-com-nome-e-prazo', 'Metas com nome e prazo',
  'Transforme desejos vagos em conquistas concretas.',
  'Dizer "quero economizar" raramente funciona porque nosso cérebro precisa de clareza para resistir a tentações imediatas.

Quando você dá um nome ("Viagem de férias com meus filhos"), um valor (R$ 3.000) e uma data (em 12 meses), a mágica da matemática entra em ação: R$ 250 por mês.

Ver a barrinha e o anel de progresso se completando a cada aporte gera dopamina e reforça o seu compromisso consigo mesma.',
  'Meta: Notebook para trabalhar e estudar (R$ 2.400 em 8 meses). Aporte mensal necessário: R$ 300/mês.',
  'Acompanhe no PurplePiggy a previsão estimada de conclusão calculada a partir dos seus aportes reais!', 5, 1, 'Target'
),
(
  'planejamento-financeiro', 'Planejamento financeiro', 'Construa seus sonhos com constância.', 5,
  'revisao-mensal-10-min', 'Revisão mensal de 10 minutos',
  'Um momento de carinho com a sua vida financeira.',
  'No final de cada mês, reserve apenas 10 minutos para abrir o PurplePiggy com uma xícara de café ou chá.

Olhe o que foi gasto com curiosidade, não com julgamento. O que funcionou bem? Houve algum imprevisto familiar? O que podemos ajustar para o próximo mês?

Essa rotina simples elimina a ansiedade do dinheiro e devolve o volante da sua vida para as suas mãos.',
  'Se a categoria Alimentação extrapolou o limite devido a aniversários, ajuste para compensar no mês seguinte sem sofrimento.',
  'Defina um lembrete no celular para o último dia de cada mês.', 4, 2, 'Calendar'
),

-- Trilha 6
(
  'consumo-consciente', 'Consumo consciente', 'Faça escolhas que valorizam seu esforço.', 6,
  'desejo-vs-necessidade', 'Desejo, necessidade e impulso',
  'A regra das 48 horas contra as compras no calor do momento.',
  'Necessidades são as coisas fundamentais para viver com dignidade e saúde. Desejos são as coisas que tornam a vida mais prazerosa e interessante. Ambos têm espaço no seu dinheiro!

O perigo mora no impulso: comprar algo influenciada por cansaço, ansiedade, uma promoção com tempo limitado ou um anúncio nas redes sociais.

A regra de ouro é: antes de comprar algo não essencial acima de R$ 100, espere 48 horas. Se a vontade continuar forte após esse tempo, avalie se cabe no seu orçamento.',
  'Aquele casaco em promoção por R$ 220: ao esperar 48 horas, na maioria das vezes a euforia passa e você percebe que o valor rende muito mais na sua meta de viagem.',
  'Use o Simulador de Compras do PurplePiggy para ver o impacto exato do item nas suas metas antes de passar o cartão.', 5, 1, 'ShoppingBag'
),
(
  'consumo-consciente', 'Consumo consciente', 'Faça escolhas que valorizam seu esforço.', 6,
  'perguntas-antes-de-comprar', 'Perguntas antes de comprar',
  'O filtro de três perguntas para proteger seu bolso.',
  'Antes de finalizar qualquer compra importante, passe o item por três perguntas simples:
1. Eu realmente preciso ou quero muito isso agora?
2. Esse valor cabe no meu orçamento sem me deixar no aperto nas próximas semanas?
3. O que eu estou deixando de fazer no meu futuro ao gastar esse dinheiro hoje?

Essas perguntas colocam a sua razão no comando e evitam o remorso pós-compra que tantas pessoas sentem.',
  'Um almoço fora de R$ 80 todo sábado pode significar R$ 320 no mês. Reduzir para cada 15 dias libera R$ 160 mensais direto para sua reserva.',
  'Consumo consciente não é privação, é escolha deliberada.', 5, 2, 'HelpCircle'
),

-- Trilha 7
(
  'golpes-financeiros', 'Golpes financeiros', 'Proteja seu dinheiro e suas informações.', 7,
  'sinais-de-alerta', 'Sinais de alerta: como identificar armadilhas',
  'Desconfie de promessas milagrosas e pedidos de urgência.',
  'Criminosos financeiros exploram momentos de vulnerabilidade, cansaço ou desejo legítimo de sair de dívidas.

Os sinais mais frequentes de golpe são: pressão para agir imediatamente ("últimas vagas", "sua conta será bloqueada hoje"), promessas de ganhos altos e fáceis sem risco, e links suspeitos recebidos por SMS ou WhatsApp.

Bancos oficiais e instituições legítimas nunca pedem sua senha, nunca pedem fotos do cartão com código de segurança e nunca mandam motoboy retirar seu cartão.',
  'Mensagem "Seu cartão foi clonado, ligue para o 0800...": desligue imediatamente e ligue para o número oficial impresso atrás do seu cartão físico.',
  'Nunca clique em links de mensagens de desconhecidos. Em caso de dúvida, entre direto no aplicativo oficial do banco.', 5, 1, 'ShieldAlert'
),
(
  'golpes-financeiros', 'Golpes financeiros', 'Proteja seu dinheiro e suas informações.', 7,
  'golpes-de-pix-e-boleto', 'Boleto falso e golpes de Pix',
  'Atenção aos detalhes que salvam seu salário.',
  'Golpes envolvendo boletos adulterados e transferências Pix por engano são cada vez mais sofisticados.

Ao pagar um boleto, confira sempre a tela final de confirmação: o nome do beneficiário (quem vai receber) é a empresa correta? Os três primeiros dígitos do código de barras correspondem ao código do banco emissor?

No Pix, desconfie de pedidos de dinheiro em nome de parentes ou amigos vindos de números novos ("troquei de número"). Ligue por voz para a pessoa antes de transferir qualquer centavo.',
  'Se você deve para a companhia de energia de R$ 180, ao ler o código de barras, o beneficiário deve ser a concessionária oficial e não uma pessoa física desconhecida.',
  'Ative limites diários baixos para Pix à noite e para novos contatos nas configurações do seu banco.', 6, 2, 'Lock'
),

-- Trilha 8
(
  'economia-domestica', 'Economia doméstica', 'Cuidando da casa e da família sem sobrecarga.', 8,
  'gastos-invisiveis-familia', 'Cuidando da casa sem se sobrecarregar',
  'Dando visibilidade aos gastos de quem sustenta e cuida.',
  'Pesquisas de 2026 mostram que 4 em cada 10 mulheres são as principais responsáveis pelo sustento da casa, e 32% são as únicas provedoras financeiras da família.

Muitas vezes, a sobrecarga feminina envolve os chamados "gastos invisíveis": o lanche da escola, a cópia da apostila, o remédio do idoso, a fralda ou o presente do coleguinha.

No PurplePiggy, criamos a categoria exclusiva "Cuidados com a família" para que esses atos de amor apareçam com clareza no orçamento e possam ser planejados.',
  'Somados, pequenos gastos semanais de R$ 25 com farmácia e material para os filhos chegam a R$ 300 ou R$ 400 por mês. Dar nome a eles traz alívio mental.',
  'Compartilhe com as pessoas que moram com você os custos reais da casa. A transparência engaja a família.', 6, 1, 'Home'
),
(
  'economia-domestica', 'Economia doméstica', 'Cuidando da casa e da família sem sobrecarga.', 8,
  'pequenos-ajustes-que-somam', 'Pequenos ajustes que somam',
  'Planejamento de mercado, cardápio semanal e assinaturas.',
  'Economizar na rotina doméstica não requer sacrifícios extremos, mas sim planejamento prático e inteligente.

Fazer um cardápio semanal simples antes de ir ao mercado evita o desperdício de comida estragando na geladeira e diminui as compras impulsivas no meio da semana.

Outro ponto campeão de vazamento financeiro são as assinaturas recorrentes (streamings, aplicativos, planos de telefone desatualizados) que continuamos pagando mesmo sem usar.',
  'Revisar assinaturas de streaming e planos de celular pode facilmente liberar entre R$ 60 e R$ 120 por mês para suas metas.',
  'Vá ao mercado sempre com lista na mão e nunca de estômago vazio!', 5, 2, 'Tag'
)
on conflict do nothing;
