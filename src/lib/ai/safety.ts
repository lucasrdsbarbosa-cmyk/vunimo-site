/**
 * Detecção simples de sinais de risco, feita no servidor antes de chamar a IA.
 * Não substitui avaliação humana: serve para mostrar os canais de ajuda na hora.
 * Lista inicial — deve ser revisada por profissionais da equipe.
 */
const RISK_PATTERNS = [
  /me\s+matar/i,
  /suic[ií]d/i,
  /tirar\s+(a\s+)?minha\s+(pr[oó]pria\s+)?vida/i,
  /n[aã]o\s+quero\s+mais\s+viver/i,
  /quero\s+morrer/i,
  /me\s+machucar/i,
  /me\s+cortar/i,
  /autoles[aã]o/i,
  /acabar\s+com\s+tudo/i,
  /vou\s+(te\s+)?matar/i,
  /amea[cç]/i,
  /nudes?\b/i,
  /fotos?\s+[ií]ntimas?/i,
];

export function hasRiskSignal(text: string): boolean {
  return RISK_PATTERNS.some((re) => re.test(text));
}
