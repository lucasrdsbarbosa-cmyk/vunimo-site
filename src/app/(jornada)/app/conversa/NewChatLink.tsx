"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icons";

/** "Nova conversa": cada clique abre uma conversa vazia, com histórico separado das outras. */
export function NewChatLink({ current }: { current: boolean }) {
  const router = useRouter();
  return (
    <Link
      href="/app/conversa?nova=1"
      className="btn btn-secondary vn-press w-full"
      aria-current={current ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        // Endereço único: a tela do chat recomeça do zero mesmo se já estava numa conversa nova.
        router.push(`/app/conversa?nova=${Date.now()}`);
      }}
    >
      <Icon name="chat" className="h-5 w-5" />
      Nova conversa
    </Link>
  );
}
