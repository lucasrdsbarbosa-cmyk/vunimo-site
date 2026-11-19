"use client";

import { Field } from "./Form";
import { PROFESSIONS, UFS } from "@/lib/validation";
import type { FieldErrors } from "@/lib/validation";

/** Campos do perfil profissional, usados no cadastro e na edição. */
export function ProfileFields({
  values,
  errors,
}: {
  values: Record<string, string | undefined>;
  errors?: FieldErrors;
}) {
  return (
    <>
      <Field label="Nome completo" name="fullName" autoComplete="name" required defaultValue={values.fullName} errors={errors?.fullName} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Área de atuação" name="profession" required options={PROFESSIONS} defaultValue={values.profession} errors={errors?.profession} />
        <Field
          label="Como você pode atender"
          name="modality"
          required
          options={[
            { value: "online", label: "Online" },
            { value: "presencial", label: "Presencial" },
            { value: "ambos", label: "Online e presencial" },
          ]}
          defaultValue={values.modality}
          errors={errors?.modality}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr]">
        <Field
          label="Registro no conselho"
          name="registryNumber"
          hint="Ex.: CRP 06/123456, CRM 123456"
          required
          defaultValue={values.registryNumber}
          errors={errors?.registryNumber}
        />
        <Field label="Estado do registro" name="registryState" required options={UFS} defaultValue={values.registryState} errors={errors?.registryState} />
      </div>
      <Field label="Cidade" name="city" autoComplete="address-level2" defaultValue={values.city} errors={errors?.city} />
      <Field
        label="Áreas de experiência"
        name="specialties"
        hint="Ex.: adolescência, ansiedade, violência online"
        maxLength={200}
        required
        defaultValue={values.specialties}
        errors={errors?.specialties}
      />
      <Field
        label="Apresentação para os jovens"
        name="bio"
        hint="Escreva de um jeito simples e acolhedor. Aparece no diretório."
        multiline
        rows={5}
        maxLength={800}
        required
        defaultValue={values.bio}
        errors={errors?.bio}
      />
    </>
  );
}
