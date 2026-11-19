"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/pro";
import { FocusFirstError, FormMessage, SubmitButton } from "@/components/Form";
import { ProfileFields } from "@/components/ProfileFields";
import type { FormState } from "@/lib/validation";

export function ProfileForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FocusFirstError errors={state.errors} />
      <FormMessage message={state.message} ok={state.ok} />
      <ProfileFields values={state.values ?? initial} errors={state.errors} />
      <div>
        <SubmitButton pendingLabel="Salvando…">Salvar perfil</SubmitButton>
      </div>
    </form>
  );
}
