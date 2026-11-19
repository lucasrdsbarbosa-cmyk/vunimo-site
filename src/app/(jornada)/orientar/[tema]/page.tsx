import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findTopic, TOPICS } from "@/lib/content";
import { TopicList } from "@/components/TopicList";
import { TrackVisit } from "@/components/TrackVisit";
import { Icon } from "@/components/Icons";

export function generateStaticParams() {
  return TOPICS.map((t) => ({ tema: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/orientar/[tema]">): Promise<Metadata> {
  const { tema } = await params;
  return { title: findTopic(tema)?.title ?? "Orientação" };
}

export default async function TopicPage({ params }: PageProps<"/orientar/[tema]">) {
  const { tema } = await params;
  const topic = findTopic(tema);
  if (!topic) notFound();
  const index = TOPICS.findIndex((t) => t.slug === topic.slug);
  const nextTopic = TOPICS[(index + 1) % TOPICS.length];

  return (
    <div>
      <TrackVisit path={`/orientar/${topic.slug}`} />
      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden h-fit rounded-[var(--radius-card)] bg-nevoa p-3 lg:block">
          <p className="px-2 pb-2 pt-1 font-semibold text-muted">Temas</p>
          <TopicList current={topic.slug} />
        </aside>

        <article className="rounded-[var(--radius-card)] bg-white p-6 sm:p-10">
          <Link href="/orientar" className="inline-flex min-h-11 items-center gap-2 font-semibold text-iris">
            <Icon name="back" className="h-5 w-5" />
            Todos os temas
          </Link>
          <h1 className="mt-3 text-[2rem] leading-tight sm:text-4xl">{topic.headline}</h1>
          <p className="mt-2 text-lg text-muted">{topic.summary}</p>

          <ol className="mt-8 grid gap-4">
            {topic.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl bg-nevoa/60 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-iris">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-lg">{s.title}</h2>
                  <p className="mt-1 text-grafite/85">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <ul className="mt-6 grid gap-2 text-muted">
            {topic.notes.map((n) => (
              <li key={n} className="flex gap-2">
                <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-iris" />
                {n}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/conectar" className="btn btn-primary">
              Ver caminhos de apoio
            </Link>
            <Link href={`/orientar/${nextTopic.slug}`} className="btn btn-secondary">
              Próximo tema: {nextTopic.title}
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
