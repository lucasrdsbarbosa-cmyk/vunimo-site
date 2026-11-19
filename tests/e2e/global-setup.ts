import { execSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

/** Recria as contas fictícias e apaga contas criadas por testes anteriores. */
export default function globalSetup() {
  execSync("npm run seed", { stdio: "inherit" });
  const db = new DatabaseSync(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "vunimo.db"));
  db.exec("PRAGMA foreign_keys = ON");
  db.prepare("DELETE FROM users WHERE email LIKE '%@e2e.vunimo.test'").run();
  db.close();
}
