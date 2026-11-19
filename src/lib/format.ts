const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDate(ms: number): string {
  return dateFmt.format(new Date(ms));
}

export const STATUS_LABEL: Record<string, string> = {
  open: "Aguardando resposta",
  accepted: "Respondido",
  closed: "Encerrado",
  cancelled: "Cancelado",
};
