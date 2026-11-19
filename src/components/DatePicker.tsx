"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/* Datas como "AAAA-MM-DD", calculadas em UTC para não depender do fuso do aparelho. */
type YM = { y: number; m: number }; // m: 0–11

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};
const utc = (iso: string) => {
  const { y, m, d } = parse(iso);
  return new Date(Date.UTC(y, m, d));
};
const fromDate = (dt: Date) => toIso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
const addDays = (iso: string, n: number) => {
  const dt = utc(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromDate(dt);
};
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const addMonths = (iso: string, n: number) => {
  const { y, m, d } = parse(iso);
  const t = new Date(Date.UTC(y, m + n, 1));
  const ty = t.getUTCFullYear();
  const tm = t.getUTCMonth();
  return toIso(ty, tm, Math.min(d, daysIn(ty, tm)));
};
const ymOf = (iso: string): YM => {
  const { y, m } = parse(iso);
  return { y, m };
};
const cmpYM = (a: YM, b: YM) => a.y * 12 + a.m - (b.y * 12 + b.m);
const isIso = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

const fmtLong = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const fmtWeekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEK_FULL = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/**
 * Seletor de data com a identidade da Vunimo: hoje com anel Lima, dia escolhido em Íris com os cantos do símbolo,
 * dias indisponíveis apagados e riscados. Abre como cartão no computador e como folha no celular.
 * Teclado: setas (dia/semana), Home/End (início/fim da semana), PageUp/PageDown (mês; com Shift, ano),
 * Enter/Espaço escolhe, Esc fecha e volta ao campo.
 */
export function DatePicker({
  id,
  name,
  defaultValue,
  today,
  max,
  required,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  today: string;
  max?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [value, setValue] = useState(isIso(defaultValue) ? defaultValue! : "");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [view, setView] = useState<YM>(() => ymOf(value || today));
  const [focus, setFocus] = useState(value || today);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusDay = useRef(false);
  const returnFocus = useRef(false);
  const titleId = useId();
  const popId = useId();

  const limit = max && isIso(max) ? max : undefined;
  const clamp = (iso: string) => (limit && iso > limit ? limit : iso);

  function openCal() {
    const start = clamp(value || today);
    setView(ymOf(start));
    setFocus(start);
    setDir(null);
    setClosing(false);
    focusDay.current = true;
    setOpen(true);
  }

  function close(refocus: boolean) {
    if (!open) return;
    returnFocus.current = refocus;
    setClosing(true);
  }

  function finishClose() {
    setOpen(false);
    setClosing(false);
    if (returnFocus.current) triggerRef.current?.focus();
    returnFocus.current = false;
  }

  function showMonth(next: YM) {
    const diff = cmpYM(next, view);
    if (diff === 0) return;
    setDir(diff > 0 ? "next" : "prev");
    setView(next);
  }

  function moveFocus(iso: string) {
    const target = clamp(iso);
    setFocus(target);
    showMonth(ymOf(target));
    focusDay.current = true;
  }

  function pick(iso: string) {
    setValue(iso);
    setFocus(iso);
    close(true);
  }

  // Leva o foco ao dia certo depois de abrir ou de navegar pelo teclado.
  useEffect(() => {
    if (!open || closing || !focusDay.current) return;
    focusDay.current = false;
    wrapRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
  }, [open, closing, focus, view]);

  // Clique fora fecha (sem roubar o foco de onde a pessoa clicou).
  useEffect(() => {
    if (!open || closing) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        returnFocus.current = false;
        setClosing(true);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, closing]);

  function onGridKey(e: KeyboardEvent<HTMLTableSectionElement>) {
    const wd = utc(focus).getUTCDay();
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -wd),
      End: () => addDays(focus, 6 - wd),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  }

  // Monta as semanas do mês visível (dias de outros meses ficam em branco).
  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const total = daysIn(view.y, view.m);
  const cells: (string | null)[] = [...Array(first).fill(null)];
  for (let d = 1; d <= total; d++) cells.push(toIso(view.y, view.m, d));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const monthKey = `${view.y}-${view.m}`;
  const rawMonth = fmtMonth.format(new Date(Date.UTC(view.y, view.m, 1)));
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
  const nextDisabled = limit ? cmpYM(view, ymOf(limit)) >= 0 : false;
  const yesterday = addDays(today, -1);
  // Se o dia focado não está neste mês (mudou pelas setas do cabeçalho), o primeiro dia disponível recebe o Tab.
  const tabbable =
    focus.startsWith(`${view.y}-${pad(view.m + 1)}`) && !(limit && focus > limit)
      ? focus
      : clamp(toIso(view.y, view.m, 1));
  const state = closing ? "closing" : "open";

  return (
    <div
      ref={wrapRef}
      className="vn-date"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        }
      }}
      onBlur={(e) => {
        if (open && !closing && e.relatedTarget && !wrapRef.current?.contains(e.relatedTarget as Node)) {
          returnFocus.current = false;
          setClosing(true);
        }
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="field-input vn-date-trigger"
        aria-haspopup="dialog"
        aria-expanded={open && !closing}
        aria-controls={open ? popId : undefined}
        data-invalid={invalid ? "" : undefined}
        data-required={required ? "" : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={describedBy}
        onClick={() => (open && !closing ? close(true) : openCal())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openCal();
          }
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-iris" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="4" />
          <path d="M8 3v4M16 3v4M3.5 10h17" />
        </svg>
        <span id={`${id}-value`} className={value ? "" : "text-muted"}>
          {value ? `${fmtLong.format(utc(value))}${value === today ? " (hoje)" : ""}` : "Escolha uma data"}
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="vn-date-chev h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <>
          <div className="vn-cal-backdrop" data-state={state} aria-hidden="true" onClick={() => close(true)} />
          <div
            id={popId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            className="vn-cal"
            data-state={state}
            onAnimationEnd={(e) => {
              if (closing && e.target === e.currentTarget) finishClose();
            }}
          >
            <div className="vn-cal-head">
              <button
                type="button"
                className="vn-cal-nav"
                aria-label="Mês anterior"
                onClick={() => showMonth(ymOf(addMonths(toIso(view.y, view.m, 1), -1)))}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <h2 id={titleId} className="vn-cal-title" aria-live="polite">
                <span key={monthKey}>{monthLabel}</span>
              </h2>
              <button
                type="button"
                className="vn-cal-nav"
                aria-label="Próximo mês"
                disabled={nextDisabled}
                onClick={() => showMonth(ymOf(addMonths(toIso(view.y, view.m, 1), 1)))}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className="vn-cal-quick">
              <button type="button" aria-pressed={value === today} onClick={() => pick(today)}>
                Hoje
              </button>
              <button type="button" aria-pressed={value === yesterday} onClick={() => pick(yesterday)}>
                Ontem
              </button>
            </div>

            <table className="vn-cal-grid" role="grid" aria-labelledby={titleId}>
              <thead>
                <tr>
                  {WEEK.map((w, i) => (
                    <th key={i} scope="col">
                      <abbr title={WEEK_FULL[i]} className="no-underline">
                        {w}
                      </abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody key={monthKey} className="vn-cal-body" data-dir={dir ?? undefined} onKeyDown={onGridKey}>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((iso, di) =>
                      iso ? (
                        <td key={iso} role="gridcell" aria-selected={iso === value}>
                          <button
                            type="button"
                            className="vn-day"
                            data-iso={iso}
                            data-today={iso === today ? "" : undefined}
                            aria-current={iso === today ? "date" : undefined}
                            aria-pressed={iso === value}
                            disabled={Boolean(limit && iso > limit)}
                            tabIndex={iso === tabbable ? 0 : -1}
                            aria-label={`${fmtWeekday.format(utc(iso))}, ${fmtLong.format(utc(iso))}${iso === today ? ", hoje" : ""}${
                              limit && iso > limit ? ", indisponível" : ""
                            }`}
                            onClick={() => pick(iso)}
                            onFocus={() => setFocus(iso)}
                          >
                            {parse(iso).d}
                          </button>
                        </td>
                      ) : (
                        <td key={`v${wi}-${di}`} aria-hidden="true" />
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="vn-cal-foot">
              <span className="vn-cal-legend" aria-hidden="true">
                <span>
                  <i style={{ boxShadow: "inset 0 0 0 2px var(--color-lima)" }} />
                  Hoje
                </span>
                <span>
                  <i style={{ background: "var(--color-iris)", borderRadius: "0.45rem 0.15rem" }} />
                  Escolhido
                </span>
              </span>
              {limit ? <span>Sem datas futuras</span> : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
