"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { duration, fade, spring } from "@/lib/motion";
import { DatePicker } from "./DatePicker";

/** Depois de um envio com erro, leva o foco ao primeiro campo inválido do formulário. */
export function FocusFirstError({ errors }: { errors?: Record<string, string[] | undefined> }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;
    const form = ref.current?.closest("form");
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  return <span ref={ref} hidden />;
}

export function SubmitButton({
  children,
  pendingLabel = "Enviando…",
  className = "btn btn-primary",
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      data-pending={pending ? "" : undefined}
      name={name}
      value={value}
    >
      {pending ? <PendingLabel>{pendingLabel}</PendingLabel> : children}
    </button>
  );
}

/** Texto de espera com três pontinhos animados (o texto já termina em "…" para leitores de tela). */
function PendingLabel({ children }: { children: ReactNode }) {
  const text = typeof children === "string" ? children.replace(/…$/, "") : children;
  return (
    <>
      <span>{text}</span>
      <span className="vn-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sr-only">…</span>
    </>
  );
}

/**
 * Botão de envio que pede confirmação antes de uma ação que não pode ser desfeita.
 * Usa um diálogo da Vunimo (foco preso, Esc cancela) em vez do "confirm" do navegador.
 */
export function ConfirmSubmit({
  children,
  confirmText,
  className = "btn btn-danger",
  pendingLabel = "Apagando…",
}: {
  children: ReactNode;
  confirmText: string;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        disabled={pending}
        data-pending={pending ? "" : undefined}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {pending ? <PendingLabel>{pendingLabel}</PendingLabel> : children}
      </button>
      <dialog
        ref={dialogRef}
        className="vn-confirm"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="p-6">
          <span aria-hidden="true" className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-alerta-bg text-xl font-bold text-alerta">
            !
          </span>
          <h2 id={titleId} className="text-lg">
            {confirmText}
          </h2>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-secondary" autoFocus onClick={() => dialogRef.current?.close()}>
              Voltar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                dialogRef.current?.close();
                triggerRef.current?.form?.requestSubmit();
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  errors?: string[];
  defaultValue?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "email";
  placeholder?: string;
  options?: readonly string[] | { value: string; label: string }[];
  /** Só para type="date": último dia que pode ser escolhido (AAAA-MM-DD) e o dia de hoje. */
  max?: string;
  today?: string;
};

export function Field({
  label,
  name,
  hint,
  errors,
  defaultValue,
  type = "text",
  autoComplete,
  required,
  multiline,
  rows = 5,
  maxLength,
  inputMode,
  placeholder,
  options,
  max,
  today,
}: FieldProps) {
  const id = `f-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = errors?.length ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    required,
    defaultValue,
    "aria-invalid": errors?.length ? true : undefined,
    "aria-describedby": describedBy,
    className: "field-input",
  } as const;

  return (
    <div className="grid gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="font-semibold text-grafite">
        {label}
        {!required ? <span className="font-normal text-muted"> (opcional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="-mt-0.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {type === "date" && today ? (
        <DatePicker
          id={id}
          name={name}
          defaultValue={defaultValue}
          max={max}
          today={today}
          required={required}
          invalid={Boolean(errors?.length)}
          describedBy={describedBy}
        />
      ) : options ? (
        <select {...common} defaultValue={defaultValue ?? ""}>
          <option value="" disabled>
            Escolha uma opção
          </option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
      ) : multiline ? (
        <textarea {...common} rows={rows} maxLength={maxLength} placeholder={placeholder} />
      ) : (
        <input
          {...common}
          type={type}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          spellCheck={type === "email" || type === "password" ? false : undefined}
          autoCapitalize={type === "email" ? "none" : undefined}
        />
      )}
      {errors?.length ? (
        <p id={errId} className="text-sm font-semibold text-alerta">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  name,
  children,
  errors,
  defaultChecked,
}: {
  name: string;
  children: ReactNode;
  errors?: string[];
  defaultChecked?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? `${id}-err` : undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-iris)]"
        />
        <span className="text-[0.95rem]">{children}</span>
      </label>
      {errors?.length ? (
        <p id={`${id}-err`} className="text-sm font-semibold text-alerta">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  return (
    <div aria-live="polite" role={ok ? "status" : "alert"}>
      <AnimatePresence initial={false}>
        {message ? (
          <motion.p
            key={message}
            data-tone={ok ? "ok" : "error"}
            className={`vn-msg flex items-start gap-2 rounded-xl px-4 py-3 text-[0.95rem] font-semibold ${
              ok ? "bg-ok-bg text-ok" : "bg-alerta-bg text-alerta"
            }`}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={ok ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1, x: [0, -5, 4, -2, 0] }}
            exit={{ opacity: 0, transition: fade }}
            transition={{ default: spring.gentle, x: { duration: duration.slow, ease: "easeInOut", delay: 0.1 } }}
          >
            {ok ? (
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...spring.pop, delay: 0.1 }}
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </motion.svg>
            ) : null}
            <span>{message}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
