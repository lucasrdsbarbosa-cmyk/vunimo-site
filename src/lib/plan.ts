/**
 * Plano de próximos passos: regras fixas (sem IA) para ser previsível e revisável pela equipe.
 * As respostas ficam salvas só para o jovem; o checklist é recalculado a partir delas.
 */

export const PLAN_QUESTIONS = {
  where: {
    label: "Onde aconteceu?",
    options: [
      { value: "rede", label: "Numa rede social (Instagram, TikTok…)" },
      { value: "jogo", label: "Num jogo online" },
      { value: "mensagens", label: "Em mensagens ou grupos (WhatsApp, Discord…)" },
      { value: "varios", label: "Em mais de um lugar" },
    ],
  },
  kinds: {
    label: "O que aconteceu? Marque tudo que se aplica.",
    options: [
      { value: "ofensas", label: "Ofensas, xingamentos ou humilhação" },
      { value: "exposicao", label: "Exposição de fotos, vídeos ou informações minhas" },
      { value: "ameaca", label: "Ameaças" },
      { value: "perfil-falso", label: "Perfil falso ou alguém se passando por mim" },
      { value: "exclusao", label: "Exclusão ou isolamento em grupos" },
    ],
  },
  ongoing: {
    label: "Ainda está acontecendo?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não, já parou" },
    ],
  },
  adult: {
    label: "Algum adulto de confiança já sabe?",
    options: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Ainda não" },
    ],
  },
  risk: {
    label: "Você se sente em perigo ou tem pensado em se machucar?",
    options: [
      { value: "nao", label: "Não" },
      { value: "sim", label: "Sim" },
    ],
  },
} as const;

export type PlanAnswers = {
  where: string;
  kinds: string[];
  ongoing: string;
  adult: string;
  risk: string;
};

export type PlanStep = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  linkLabel?: string;
  urgent?: boolean;
};

export function buildPlan(a: PlanAnswers): PlanStep[] {
  const steps: PlanStep[] = [];
  const has = (k: string) => a.kinds.includes(k);

  if (a.risk === "sim") {
    steps.push({
      id: "ajuda-agora",
      title: "Fale com alguém agora",
      detail: "Ligue para o CVV (188, 24h, gratuito) ou, em emergência, SAMU 192. Conte para um adulto que esteja perto de você.",
      href: "/conectar#canais",
      linkLabel: "Ver canais de ajuda",
      urgent: true,
    });
  }
  if (has("ameaca") || has("exposicao")) {
    steps.push({
      id: "nao-responder",
      title: "Não responda nem negocie",
      detail: "Diante de ameaça ou exposição, não envie nada nem pague. Guarde tudo e procure um adulto de confiança hoje.",
      urgent: true,
    });
  }
  steps.push({
    id: "pausa",
    title: "Faça uma pausa antes de agir",
    detail: "Um minuto de respiração ajuda a decidir com mais calma.",
    href: "/pausa",
    linkLabel: "Abrir a Pausa",
  });
  steps.push({
    id: "evidencias",
    title: "Guarde as evidências",
    detail: "Prints com nome de usuário, data e horário. Registre cada episódio na sua linha do tempo.",
    href: "/app/linha-do-tempo",
    linkLabel: "Abrir a linha do tempo",
  });
  if (a.ongoing === "sim") {
    steps.push({
      id: "silenciar-bloquear",
      title: "Silencie ou bloqueie quem está atacando",
      detail: a.where === "jogo"
        ? "Nos jogos, use silenciar no chat de voz e de texto e bloqueie o jogador pela lista da partida."
        : "Use as opções de silenciar e bloquear no perfil ou na conversa. Faça os prints antes.",
      href: "/orientar/bloquear",
      linkLabel: "Como bloquear",
    });
  }
  if (has("exclusao")) {
    steps.push({
      id: "grupo",
      title: "Saia do grupo, se fizer bem para você",
      detail: "Você não precisa ficar onde está sendo maltratado. Se for um grupo da escola, vale avisar a coordenação.",
    });
  }
  if (has("perfil-falso")) {
    steps.push({
      id: "perfil-falso",
      title: "Denuncie o perfil falso",
      detail: "Toda rede tem a opção “Denunciar > Se passando por mim”. Peça a amigos para denunciarem também.",
      href: "/orientar/denunciar",
      linkLabel: "Como denunciar",
    });
  }
  steps.push({
    id: "denunciar",
    title: "Denuncie na plataforma",
    detail: "Use a opção Denunciar no perfil, na mensagem ou na partida. O rascunho de denúncia ajuda a escrever.",
    href: "/app/denuncia",
    linkLabel: "Criar rascunho de denúncia",
  });
  if (a.adult === "nao") {
    steps.push({
      id: "adulto",
      title: "Conte para um adulto de confiança",
      detail: "Pode ser alguém da família, da escola ou um profissional. Mostrar a linha do tempo deixa a conversa mais fácil.",
    });
  }
  if (has("exposicao") || has("ameaca")) {
    steps.push({
      id: "safernet",
      title: "Procure a SaferNet",
      detail: "O canal de ajuda da SaferNet orienta casos de exposição e ameaça online, de forma gratuita.",
      href: "https://new.safernet.org.br/helpline",
      linkLabel: "Abrir a SaferNet",
    });
  }
  steps.push({
    id: "profissional",
    title: "Peça apoio a um profissional",
    detail: "Envie um pedido a um profissional de saúde da Vunimo. Você escolhe se anexa um resumo da linha do tempo.",
    href: "/app/pedidos",
    linkLabel: "Pedir apoio",
  });
  return steps;
}
