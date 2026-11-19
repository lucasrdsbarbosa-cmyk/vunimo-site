/**
 * Cria (ou recria) as contas fictícias de teste, todas com e-mail @vunimo.test.
 * Uso: npm run seed
 * Só mexe em contas @vunimo.test; contas criadas por você no site ficam como estão.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { migrate, SCHEMA } from "../src/lib/schema.ts";

const TEST_PASSWORD = "Vunimo@teste1";

const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "vunimo.db");
mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(SCHEMA);
migrate(db);

const now = Date.now();
const hash = bcrypt.hashSync(TEST_PASSWORD, 12);

db.exec("BEGIN");
db.prepare("DELETE FROM users WHERE email LIKE '%@vunimo.test'").run();

function user(email: string, role: string, name: string, birthYear: number | null = null): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role, display_name, birth_year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, email, hash, role, name, birthYear, now);
  return id;
}

function profile(id: string, p: Record<string, string>) {
  db.prepare(
    `INSERT INTO professional_profiles
     (user_id, full_name, profession, registry_number, registry_state, specialties, bio, modality, city, status, reviewed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, p.fullName, p.profession, p.registry, p.uf, p.specialties, p.bio, p.modality, p.city, p.status,
    p.status === "approved" ? now : null, now);
}

user("admin@vunimo.test", "admin", "Equipe Vunimo");

const lu = user("jovem@vunimo.test", "youth", "Lu", 2010);
const teo = user("jovem2@vunimo.test", "youth", "Teo", 2009);

const ana = user("psicologa@vunimo.test", "professional", "Ana");
profile(ana, {
  fullName: "Ana Ribeiro (fictícia)",
  profession: "Psicologia",
  registry: "CRP 00/000000",
  uf: "SP",
  specialties: "Adolescência, ansiedade, violência online",
  bio: "Trabalho com adolescentes há dez anos. Aqui você pode contar o que aconteceu no seu ritmo — vou te ajudar a pensar nos próximos passos.",
  modality: "online",
  city: "São Paulo",
  status: "approved",
});

const carlos = user("medico@vunimo.test", "professional", "Carlos");
profile(carlos, {
  fullName: "Carlos Mendes (fictício)",
  profession: "Psiquiatria",
  registry: "CRM 000000",
  uf: "MG",
  specialties: "Psiquiatria da infância e adolescência",
  bio: "Perfil de teste aguardando análise da equipe. Não deve aparecer no diretório até ser aprovado.",
  modality: "ambos",
  city: "Belo Horizonte",
  status: "pending",
});

db.prepare(
  "INSERT INTO journal_entries (id, user_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
).run(randomUUID(), lu, "Depois da partida", "Hoje no jogo começaram a me xingar no chat de voz. Saí da partida, mas fiquei pensando nisso.", now - 86_400_000, now - 86_400_000);
db.prepare(
  "INSERT INTO journal_entries (id, user_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
).run(randomUUID(), teo, "Registro privado do Teo", "Este texto só pode ser lido pelo Teo.", now, now);

db.prepare("INSERT INTO progress (user_id, last_path, last_label, updated_at) VALUES (?, ?, ?, ?)")
  .run(lu, "/orientar/bloquear", "Orientação: Bloquear", now - 3_600_000);

db.prepare(
  `INSERT INTO support_requests (id, youth_id, professional_id, topic, message, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
).run(randomUUID(), teo, ana, "Exclusão ou isolamento em grupos",
  "Me tiraram do grupo da turma e estão falando de mim em outro grupo. Não sei se conto pra alguém.", now - 7_200_000, now - 7_200_000);

// Linha do tempo fictícia da Lu (para testar rascunho de denúncia e anexo em pedidos).
const day = (offset: number) => new Date(now - offset * 86_400_000).toISOString().slice(0, 10);
const tl = db.prepare(
  `INSERT INTO timeline_events (id, user_id, happened_on, happened_time, platform, kind, description, people,
     has_evidence, evidence_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
tl.run(randomUUID(), lu, day(3), "21:40", "Roblox", "Ofensas ou xingamentos",
  "No chat da partida, começaram a me xingar e chamar os outros para fazer o mesmo.", "jogador_fake123", 1, "Pasta Prints no celular", now, now);
tl.run(randomUUID(), lu, day(1), "", "WhatsApp", "Exclusão de grupo",
  "Me removeram do grupo da turma e criaram outro grupo sem mim, onde postaram print da partida.", "", 0, "", now, now);

db.exec("COMMIT");

console.log(`Contas de teste criadas em ${file}`);
console.log("  admin@vunimo.test      administração");
console.log("  jovem@vunimo.test      jovem (Lu) — tem diário e progresso salvos");
console.log("  jovem2@vunimo.test     jovem (Teo) — tem um pedido aberto para a Ana");
console.log("  psicologa@vunimo.test  profissional aprovada (Ana)");
console.log("  medico@vunimo.test     profissional em análise (Carlos)");
console.log("Senha de todas: veja TEST_PASSWORD em scripts/seed.mts ou o README.");
