import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db, now } from "./db";

export const SESSION_COOKIE = "vunimo_session";
const SESSION_DAYS = 14;

export type Role = "youth" | "professional" | "admin";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  displayName: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco (só o hash do token é guardado) e grava o cookie. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expiresAt);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  jar.delete(SESSION_COOKIE);
}

/** Usuário da requisição atual (deduplicado por requisição) ou null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.role, u.display_name, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | { id: string; email: string; role: Role; display_name: string; expires_at: number }
    | undefined;
  if (!row) return null;
  if (row.expires_at < now()) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  return { id: row.id, email: row.email, role: row.role, displayName: row.display_name };
});

export function homeFor(role: Role): string {
  if (role === "professional") return "/pro";
  if (role === "admin") return "/admin";
  return "/app";
}
