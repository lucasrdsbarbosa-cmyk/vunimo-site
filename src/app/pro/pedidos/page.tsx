import type { Metadata } from "next";
import { listRequestsForMe } from "@/lib/dal";
import { formatDate, STATUS_LABEL } from "@/lib/format";
import { PageTitle } from "@/components/PageTitle";
import { ResponseForm } from "./ResponseForm";

export const metadata: Metadata = { title: "Pedidos recebidos" };

export default async function ProRequestsPage() {
  const requests = await listRequestsForMe();
  return (
    <div>
      <PageTitle title="Pedidos recebidos" subtitle="Só você vê os pedidos enviados para você." />
      {requests.length === 0 ? (
        <p className="rounded-2xl bg-nevoa p-6">
          Nenhum pedido por enquanto. Quando um jovem escrever para você, ele aparece aqui.
        </p>
      ) : (
        <ul className="grid gap-5">
          {requests.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl">
                  {r.counterpartName} <span className="font-normal text-muted">· {r.topic}</span>
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    r.status === "open" ? "bg-lima text-grafite" : "bg-nevoa text-iris"
                  }`}
                >
                  {r.status === "open" ? "Novo" : STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="text-sm text-muted">Recebido em {formatDate(r.createdAt)}</p>
              <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-nevoa/60 p-4">{r.message}</p>
              <div className="mt-5">
                {r.status === "closed" ? (
                  <div>
                    <p className="text-sm font-semibold text-iris">Sua resposta</p>
                    <p className="mt-1 whitespace-pre-wrap">{r.response}</p>
                  </div>
                ) : (
                  <ResponseForm id={r.id} current={r.response} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
