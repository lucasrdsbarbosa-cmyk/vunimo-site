/**
 * Conteúdo editorial da metodologia. Textos ficam aqui para facilitar revisão
 * pela equipe (e, no futuro, por profissionais parceiros) sem mexer nas telas.
 */

export type NucleusKey = "pausa" | "desabafar" | "orientar" | "conectar";

export const NUCLEI: {
  key: NucleusKey;
  step: string;
  name: string;
  navLabel: string;
  href: string;
  short: string;
  description: string;
}[] = [
  {
    key: "pausa",
    step: "Regular",
    name: "Pausa",
    navLabel: "Pausa",
    href: "/pausa",
    short: "Um momento para respirar",
    description: "Respiração guiada para baixar a tensão antes de decidir o que fazer.",
  },
  {
    key: "desabafar",
    step: "Desabafar",
    name: "Desabafar",
    navLabel: "Desabafar",
    href: "/desabafar",
    short: "Escrever no diário ou conversar com a IA",
    description: "Colocar em palavras o que aconteceu, no diário ou com um assistente de IA.",
  },
  {
    key: "orientar",
    step: "Orientar",
    name: "Orientação",
    navLabel: "Orientação",
    href: "/orientar",
    short: "Entender o próximo passo",
    description: "Como silenciar, bloquear, guardar evidências e denunciar em redes e jogos.",
  },
  {
    key: "conectar",
    step: "Conectar",
    name: "Apoio",
    navLabel: "Apoio",
    href: "/conectar",
    short: "Conhecer caminhos de apoio",
    description: "Canais de ajuda e profissionais de saúde que participam da Vunimo.",
  },
];

export type OrientationTopic = {
  slug: string;
  title: string;
  headline: string;
  summary: string;
  icon: "mute" | "block" | "evidence" | "flag";
  steps: { title: string; text: string }[];
  notes: string[];
};

export const TOPICS: OrientationTopic[] = [
  {
    slug: "silenciar",
    title: "Silenciar",
    headline: "Silenciar uma conversa ou perfil",
    summary: "Reduzir o contato com quem ou com o que te incomoda, sem avisar a outra pessoa.",
    icon: "mute",
    steps: [
      {
        title: "Encontre os controles",
        text: "Abra o perfil, o grupo ou a conversa e procure o menu de opções (geralmente os três pontinhos) ou as configurações de privacidade da plataforma.",
      },
      {
        title: "Confira o que dá para silenciar",
        text: "Dependendo da rede ou do jogo, você pode silenciar mensagens, publicações, menções, o chat de voz ou palavras específicas.",
      },
      {
        title: "Decida o próximo passo",
        text: "Silenciar dá um respiro. Se as mensagens continuarem ou piorarem, você pode bloquear, guardar evidências e denunciar.",
      },
    ],
    notes: [
      "Na maioria das plataformas a outra pessoa não é avisada quando você silencia.",
      "As opções mudam entre redes e jogos, e às vezes mudam com atualizações.",
    ],
  },
  {
    slug: "bloquear",
    title: "Bloquear",
    headline: "Bloquear quem está te atacando",
    summary: "Impedir novos contatos de uma pessoa ou conta.",
    icon: "block",
    steps: [
      {
        title: "Guarde o que precisa antes",
        text: "Em algumas plataformas, bloquear esconde as mensagens antigas. Se pensa em denunciar, faça capturas de tela primeiro (veja Preservar evidências).",
      },
      {
        title: "Bloqueie pelo perfil ou pela conversa",
        text: "Procure a opção “Bloquear” no perfil da pessoa, na conversa ou na lista de jogadores da partida.",
      },
      {
        title: "Revise sua privacidade",
        text: "Aproveite para limitar quem pode te mandar mensagem, te marcar ou te adicionar em grupos.",
      },
    ],
    notes: [
      "Se a pessoa criar outras contas, você pode bloquear também e registrar isso nas evidências.",
      "Bloquear não é exagero: é um jeito de cuidar de você.",
    ],
  },
  {
    slug: "preservar-evidencias",
    title: "Preservar evidências",
    headline: "Guardar registros importantes",
    summary: "Registrar o que aconteceu para conseguir pedir ajuda ou denunciar depois.",
    icon: "evidence",
    steps: [
      {
        title: "Faça capturas de tela completas",
        text: "Inclua o nome de usuário, a data e o horário. Se puder, copie também o link do perfil ou da publicação.",
      },
      {
        title: "Não edite nem responda no calor do momento",
        text: "Guarde as imagens como estão. Responder com ataques pode piorar a situação e confundir quem for ajudar.",
      },
      {
        title: "Guarde em um lugar seguro",
        text: "Salve em uma pasta só sua ou envie para um adulto de confiança. Assim você não precisa reabrir as mensagens sempre.",
      },
    ],
    notes: [
      "Você não precisa ler tudo de novo para guardar. Se for pesado, peça ajuda a alguém para organizar.",
      "Essas evidências ajudam em denúncias na plataforma, na escola ou em órgãos públicos.",
    ],
  },
  {
    slug: "denunciar",
    title: "Denunciar",
    headline: "Denunciar conteúdo que viola regras",
    summary: "Avisar a plataforma ou outros canais sobre ataques, ameaças ou exposição.",
    icon: "flag",
    steps: [
      {
        title: "Use a denúncia da plataforma",
        text: "Redes sociais e jogos têm a opção “Denunciar” no perfil, na mensagem ou na partida. Escolha o motivo mais próximo do que aconteceu.",
      },
      {
        title: "Conte para um adulto de confiança",
        text: "Pode ser alguém da família, da escola ou um profissional. Mostrar as evidências ajuda a decidir os próximos passos juntos.",
      },
      {
        title: "Conheça outros canais",
        text: "Para conteúdos ilegais, como exposição de imagens íntimas ou ameaças, também existem canais públicos de denúncia e de ajuda.",
      },
    ],
    notes: [
      "A denúncia na plataforma costuma ser anônima para quem foi denunciado.",
      "Se houver risco à sua segurança, procure ajuda imediatamente nos canais da faixa de ajuda.",
    ],
  },
];

export function findTopic(slug: string): OrientationTopic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

/**
 * Canais públicos. CONFERIR antes de publicar: telefones e endereços podem mudar.
 */
export const URGENT_CHANNELS = [
  { name: "CVV", detail: "Apoio emocional, 24h, gratuito", contact: "188", href: "tel:188" },
  { name: "SAMU", detail: "Emergência médica", contact: "192", href: "tel:192" },
  { name: "Polícia", detail: "Risco imediato à segurança", contact: "190", href: "tel:190" },
];

export const SUPPORT_CHANNELS = [
  {
    name: "CVV — Centro de Valorização da Vida",
    detail: "Conversa sigilosa e gratuita por telefone, chat ou e-mail, 24 horas.",
    contact: "Ligue 188",
    href: "https://cvv.org.br",
  },
  {
    name: "SaferNet — Canal de Ajuda",
    detail: "Orientação para quem passa por violência online, como exposição e ciberbullying.",
    contact: "Atendimento online",
    href: "https://new.safernet.org.br/helpline",
  },
  {
    name: "SaferNet — Denúncia",
    detail: "Denúncia anônima de crimes na internet.",
    contact: "Formulário online",
    href: "https://new.safernet.org.br/denuncie",
  },
  {
    name: "Disque 100",
    detail: "Denúncias de violações de direitos de crianças e adolescentes.",
    contact: "Ligue 100",
    href: "tel:100",
  },
  {
    name: "Conselho Tutelar",
    detail: "Órgão do seu município que protege os direitos de crianças e adolescentes.",
    contact: "Procure o da sua cidade",
    href: null,
  },
];

export const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Online e presencial",
};
