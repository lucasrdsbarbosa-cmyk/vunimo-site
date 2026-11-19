import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

/**
 * Banco local (SQLite embutido no Node). Para trocar por Postgres/Supabase,
 * substitua este mÃ³dulo e as consultas em `dal.ts` â€” veja docs/supabase-rls.sql.
 *
 * AlÃ©m das checagens no servidor (dal.ts), o prÃ³prio banco garante:
 * - papÃ©is vÃ¡lidos (CHECK) e e-mail Ãºnico;
 * - exclusÃ£o em cascata de todos os dados quando a conta Ã© apagada;
 * - gatilhos que impedem diÃ¡rio/IA/pedidos em contas que nÃ£o sÃ£o de jovens,
 *   pedidos para profissionais nÃ£o aprovados e troca de dono de um registro.
 */



const globalForDb = globalThis as unknown as { vunimoDb?: DatabaseSync };

function open(): DatabaseSync {
  const file =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "vunimo.db");
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export function db(): DatabaseSync {
  if (!globalForDb.vunimoDb) globalForDb.vunimoDb = open();
  return globalForDb.vunimoDb;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}

/** Executa vÃ¡rias escritas de forma atÃ´mica. */
export function transaction<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
}
