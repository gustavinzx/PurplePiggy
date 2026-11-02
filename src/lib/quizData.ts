export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const LESSON_QUIZZES: Record<string, QuizQuestion> = {
  // Trilha 1: Organização financeira
  'para-onde-vai-meu-dinheiro': {
    question: 'Qual é a melhor atitude para começar a organizar seus gastos na primeira semana?',
    options: [
      'Anotar tudo o que gasta por 7 dias, com calma e sem se julgar.',
      'Cortar imediatamente todas as coisas boas da sua rotina.',
      'Esperar o próximo mês para ver o que sobra na conta.',
    ],
    correctIndex: 0,
    explanation: 'Anotar os gastos sem culpa traz clareza para enxergar seus hábitos com carinho.',
  },
  'montando-primeiro-orcamento': {
    question: 'Por onde devemos começar ao montar um orçamento realista?',
    options: [
      'Partir da sua renda líquida real e separar os gastos essenciais.',
      'Tentar gastar menos de R$ 500 no mês inteiro.',
      'Ignorar as contas fixas e focar só no cartão.',
    ],
    correctIndex: 0,
    explanation: 'Conhecer sua renda e cobrir os essenciais é o alicerce de qualquer planejamento sustentável.',
  },

  // Trilha 2: Juros sem mistério
  'juros-o-que-sao': {
    question: 'Em poucas palavras, o que são juros?',
    options: [
      'Valores adicionais cobrados ou recebidos pelo uso do dinheiro no tempo.',
      'Uma taxa cobrada apenas quando alguém é punido pelo banco.',
      'Um imposto obrigatório que vai direto para o governo.',
    ],
    correctIndex: 0,
    explanation: 'Juros são o custo do dinheiro no tempo — tanto quando você pega emprestado quanto quando investe!',
  },
  'simples-vs-compostos': {
    question: 'Por que dívidas no cartão crescem tão rápido com juros compostos?',
    options: [
      'Porque os juros do mês seguinte são calculados sobre os juros anteriores (juros sobre juros).',
      'Porque o banco dobra o valor da dívida toda semana por lei.',
      'Porque os juros simples são sempre mais perigosos.',
    ],
    correctIndex: 0,
    explanation: 'Nos juros compostos, a base de cálculo cresce mês a mês, fazendo a bola de neve rolar mais rápido.',
  },

  // Trilha 3: Cartão de crédito
  'como-o-cartao-funciona': {
    question: 'O limite do cartão de crédito representa:',
    options: [
      'Um empréstimo pré-aprovado pelo banco, não uma extensão da sua renda.',
      'Dinheiro extra que você ganhou para gastar livremente.',
      'Um saldo de poupança que você acumulou.',
    ],
    correctIndex: 0,
    explanation: 'O cartão é uma ferramenta de pagamento, mas cada gasto precisará ser pago na fatura com a sua renda.',
  },
  'perigo-do-rotativo': {
    question: 'O que acontece quando você paga apenas o valor mínimo da fatura?',
    options: [
      'O valor restante entra no rotativo, com uma das taxas de juros mais altas do mercado.',
      'O banco perdoa o restante e a fatura zera.',
      'Você ganha desconto na próxima fatura por ter pago no prazo.',
    ],
    correctIndex: 0,
    explanation: 'O rotativo cobra juros muito altos. Se apertar, parcelar a fatura em taxa fixa costuma ser mais suave.',
  },

  // Trilha 4: Reserva de emergência
  'por-que-ter-reserva': {
    question: 'Qual é o papel principal de uma reserva de emergência?',
    options: [
      'Dar segurança para lidar com imprevistos sem precisar contrair dívidas caras.',
      'Deixar você rica da noite para o dia com investimentos arriscados.',
      'Guardar dinheiro para comprar roupas em promoções relâmpago.',
    ],
    correctIndex: 0,
    explanation: 'A reserva protege sua paz mental e sua família quando acontecimentos inesperados ocorrem.',
  },
  'comecando-pequeno': {
    question: 'Qual o primeiro passo recomendado para começar sua reserva de emergência?',
    options: [
      'Mirar primeiro em guardar o equivalente a 1 semana de gastos essenciais.',
      'Tentar guardar 10 salários inteiros logo no primeiro mês.',
      'Não começar até ter pelo menos R$ 10.000 sobrando.',
    ],
    correctIndex: 0,
    explanation: 'Passos pequenos e realistas criam o hábito e mostram que você é capaz de conquistar cada degrau!',
  },

  // Trilha 5: Planejamento financeiro
  'metas-com-nome-e-prazo': {
    question: 'Como transformar um desejo abstrato em uma meta financeira alcançável?',
    options: [
      'Dando nome claro, valor alvo e dividindo pelo número de meses até a data desejada.',
      'Torcendo para sobrar dinheiro no final do ano.',
      'Pegando um empréstimo logo para realizar tudo hoje.',
    ],
    correctIndex: 0,
    explanation: 'Uma meta com prazo e valor mensal definido se torna um plano concreto e descomplicado.',
  },
  'revisao-mensal-10-min': {
    question: 'Qual o objetivo da revisão mensal de 10 minutos?',
    options: [
      'Ver o que funcionou no mês e fazer ajustes gentis para o próximo, sem culpa.',
      'Punir a si mesma pelos gastos que passaram do limite.',
      'Refazer todas as planilhas do zero e desistir.',
    ],
    correctIndex: 0,
    explanation: 'Revisar sem cobrança ajuda a calibrar a rota com carinho e tranquilidade.',
  },

  // Trilha 6: Consumo consciente
  'desejo-vs-necessidade': {
    question: 'O que propõe a regra das 48 horas antes de uma compra por impulso?',
    options: [
      'Esperar 2 dias antes de comprar; se a vontade persistir e couber no bolso, avaliar.',
      'Comprar em até 48 minutos para não perder a promoção.',
      'Pedir autorização do gerente do banco.',
    ],
    correctIndex: 0,
    explanation: 'Dar uma pausa esfria a emoção imediata e evita compras que acabam paradas no armário.',
  },
  'perguntas-antes-de-comprar': {
    question: 'Qual dessas perguntas NÃO é recomendada antes de uma compra planejada?',
    options: [
      '"Vou me sentir culpada e envergonhada se comprar?"',
      '"Eu realmente preciso ou quero isso agora?"',
      '"Essa compra cabe com tranquilidade no meu orçamento do mês?"',
    ],
    correctIndex: 0,
    explanation: 'A PurplePiggy nunca incentiva a culpa! Avalie necessidade, cabimento e impacto com autonomia.',
  },

  // Trilha 7: Golpes financeiros
  'sinais-de-alerta': {
    question: 'Qual é um dos sinais mais frequentes de uma tentativa de golpe?',
    options: [
      'Sensação de urgência extrema ("faça agora ou sua conta será bloqueada") e links suspeitos.',
      'Um atendente educado que pede para você ligar no número oficial do cartão.',
      'Uma mensagem avisando que sua fatura fechou no aplicativo oficial.',
    ],
    correctIndex: 0,
    explanation: 'Golpistas usam a pressa e o medo para fazer você agir sem pensar. Sempre respire e cheque no app oficial!',
  },
  'golpes-de-pix-e-boleto': {
    question: 'Ao pagar um boleto ou transferir Pix, o que é fundamental conferir na tela?',
    options: [
      'O nome completo e CNPJ/CPF do beneficiário que vai receber o dinheiro.',
      'A cor do comprovante que o aplicativo gera.',
      'Apenas o valor, sem ligar para quem está recebendo.',
    ],
    correctIndex: 0,
    explanation: 'Conferir o beneficiário evita cair em boletos adulterados e chaves Pix clonadas.',
  },

  // Trilha 8: Economia doméstica
  'gastos-invisiveis-familia': {
    question: 'O que são considerados "gastos invisíveis" na rotina com a família?',
    options: [
      'Pequenas despesas recorrentes (remédios, lanches, material escolar) que não entram na planilha.',
      'Compras feitas em dinheiro que não geram cupom fiscal.',
      'Valores que o banco debita automaticamente sem aviso.',
    ],
    correctIndex: 0,
    explanation: 'Visibilizar os cuidados da família é essencial para valorizar todo o esforço feminino na casa.',
  },
  'pequenos-ajustes-que-somam': {
    question: 'Qual atitude tem maior impacto sustentável nas finanças da casa?',
    options: [
      'Pequenos ajustes rotineiros (planejar refeições, cancelar assinaturas não usadas) feitos com consistência.',
      'Ficar um mês sem comer nada diferente para compensar um gasto.',
      'Mudar de cidade repentinamente.',
    ],
    correctIndex: 0,
    explanation: 'Pequenos hábitos mantidos ao longo do tempo geram grandes economias sem sofrimento!',
  },
}

// Desafios diários rotativos estilo Duolingo
export const DAILY_CHALLENGES = [
  {
    day: 'Segunda da Organização',
    question: 'Você acabou de receber o salário. Qual é o passo mais inteligente antes de começar a gastar?',
    options: [
      'Separar primeiro os valores das contas fixas essenciais e o aporte da sua meta.',
      'Comprar tudo o que estava na lista de desejos antes que o dinheiro acabe.',
      'Deixar tudo na conta corrente sem saber quanto tem de despesas fixas.',
    ],
    correctIndex: 0,
    explanation: 'Pagar-se primeiro e proteger as contas essenciais garante um mês sem sustos!',
  },
  {
    day: 'Terça dos Juros',
    question: 'Uma loja oferece: R$ 500 à vista ou 10x de R$ 58 no cartão. O que isso significa?',
    options: [
      'Você pagará R$ 580 no total, ou seja, R$ 80 a mais em juros embutidos.',
      'O parcelamento é sem juros porque a parcela é pequena.',
      'A loja está dando um presente de R$ 80 para você.',
    ],
    correctIndex: 0,
    explanation: 'Multiplicar o valor da parcela pelo número de meses revela se há juros embutidos!',
  },
  {
    day: 'Quarta da Reserva',
    question: 'Sua geladeira quebrou e você tem R$ 600 na reserva de emergência. O que fazer?',
    options: [
      'Usar a reserva para o conserto com tranquilidade — é exatamente para isso que ela existe!',
      'Entrar no cheque especial para não mexer na reserva de jeito nenhum.',
      'Sentir culpa por ter que usar o dinheiro guardado.',
    ],
    correctIndex: 0,
    explanation: 'Usar a reserva para uma emergência real é uma vitória do seu planejamento, sem nenhuma culpa!',
  },
  {
    day: 'Quinta do Cartão',
    question: 'Qual a diferença entre a data de fechamento e a data de vencimento da fatura?',
    options: [
      'No fechamento as compras do mês são somadas; no vencimento é o dia limite para pagar a fatura.',
      'São a mesma coisa, só nomes diferentes usados pelo banco.',
      'O vencimento é quando a fatura fecha e você pode gastar mais.',
    ],
    correctIndex: 0,
    explanation: 'Comprar logo após o fechamento dá quase 40 dias para pagar, sem pagar juros adicionais.',
  },
  {
    day: 'Sexta Consciente',
    question: 'Você viu uma bota linda na promoção que não estava planejada. Qual é o teste das 48 horas?',
    options: [
      'Esperar 48 horas; se ainda quiser muito e couber sem apertar o mês, você decide com calma.',
      'Comprar imediatamente antes das 48 horas acabarem.',
      'Nunca mais comprar sapatos na vida.',
    ],
    correctIndex: 0,
    explanation: 'Esperar dois dias reduz o impulso e dá espaço para você decidir com autonomia.',
  },
]
