import Link from "next/link";
import { TOPICS } from "@/lib/content";
import { Icon } from "./Icons";

export function TopicList({ current }: { current?: string }) {
  return (
    <ul className="grid gap-2">
      {TOPICS.map((t) => {
        const active = t.slug === current;
        return (
          <li key={t.slug}>
            <Link
              href={`/orientar/${t.slug}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 items-center gap-4 rounded-2xl px-4 py-3 vn-card ${
                active
                  ? "bg-white font-semibold text-iris shadow-[inset_3px_0_0_var(--color-iris)]"
                  : "bg-white/70 hover:bg-white"
              }`}
            >
              <Icon name={t.icon} className="h-6 w-6 shrink-0 text-iris" />
              <span className="flex-1">
                <span className="block font-semibold">{t.title}</span>
                {!current ? <span className="block text-sm text-muted">{t.summary}</span> : null}
              </span>
              <Icon name="arrow" className="h-5 w-5 shrink-0 text-iris" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
