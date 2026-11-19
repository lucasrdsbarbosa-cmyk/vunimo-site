"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef, type ReactNode } from "react";

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
    <button type="submit" className={className} disabled={pending} aria-disabled={pending} name={name} value={value}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Botão de envio que pede confirmação antes de uma ação que não pode ser desfeita. */
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
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
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
      <label htmlFor={id} className="font-semibold text-grafite">
        {label}
        {!required ? <span className="font-normal text-muted"> (opcional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="-mt-0.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {options ? (
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
      {message ? (
        <p
          className={`rounded-xl px-4 py-3 text-[0.95rem] font-semibold ${
            ok ? "bg-ok-bg text-ok" : "bg-alerta-bg text-alerta"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
