import "server-only";

/**
 * Limite simples em memória (janela fixa). Suficiente para um único servidor;
 * em produção com várias instâncias, troque por Redis ou pelo banco.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const t = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
