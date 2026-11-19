"use client";

import { useEffect } from "react";
import { trackVisit } from "@/app/actions/youth";

/** Registra "onde parei" para quem está logado (o servidor ignora visitantes). */
export function TrackVisit({ path }: { path: string }) {
  useEffect(() => {
    trackVisit(path).catch(() => {});
  }, [path]);
  return null;
}
