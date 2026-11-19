import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icons";

export function PageTitle({
  title,
  subtitle,
  back,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  aside?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {back ? (
        <Link href={back.href} className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-iris">
          <Icon name="back" className="h-5 w-5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.2rem] leading-tight sm:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-lg text-muted">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
    </div>
  );
}
