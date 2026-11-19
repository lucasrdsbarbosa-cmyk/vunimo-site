-- Rascunho para quando a Vunimo migrar do SQLite local para Postgres/Supabase.
-- Reproduz no banco as mesmas regras que hoje ficam em src/lib/dal.ts + gatilhos SQLite.
-- Supõe Supabase Auth: auth.uid() = id do usuário logado; tabela public.users com a coluna role.

alter table users                 enable row level security;
alter table professional_profiles enable row level security;
alter table journal_entries       enable row level security;
alter table ai_conversations      enable row level security;
alter table ai_messages           enable row level security;
alter table progress              enable row level security;
alter table support_requests      enable row level security;

create or replace function current_role_name() returns text
language sql stable security definer set search_path = public as
$$ select role from users where id = auth.uid() $$;

-- Usuário: lê e edita só a própria linha (sem poder trocar o papel).
create policy users_self_select on users for select using (id = auth.uid());
create policy users_self_update on users for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from users where id = auth.uid()));

-- Diário, conversas e progresso: só o próprio jovem. Ninguém mais (nem admin).
create policy journal_owner on journal_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and current_role_name() = 'youth');
create policy conv_owner on ai_conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and current_role_name() = 'youth');
create policy msg_owner on ai_messages for all
  using (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy progress_owner on progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Perfil profissional: público só se aprovado (expor via VIEW sem e-mail);
-- o dono lê/edita o seu; admin lê todos e muda status.
create policy pro_public on professional_profiles for select using (status = 'approved');
create policy pro_owner_select on professional_profiles for select using (user_id = auth.uid());
create policy pro_owner_update on professional_profiles for update using (user_id = auth.uid())
  with check (user_id = auth.uid());  -- status volta a 'pending' por trigger ao mudar o registro
create policy pro_admin on professional_profiles for all using (current_role_name() = 'admin');

-- Pedidos de apoio: o jovem vê/cria/cancela os seus; o profissional aprovado vê e responde os endereçados a ele.
create policy req_youth_select on support_requests for select using (youth_id = auth.uid());
create policy req_youth_insert on support_requests for insert with check (
  youth_id = auth.uid() and current_role_name() = 'youth'
  and exists (select 1 from professional_profiles p where p.user_id = professional_id and p.status = 'approved'));
create policy req_youth_cancel on support_requests for update using (youth_id = auth.uid() and status = 'open')
  with check (youth_id = auth.uid() and status = 'cancelled');
create policy req_pro_select on support_requests for select using (
  professional_id = auth.uid()
  and exists (select 1 from professional_profiles p where p.user_id = auth.uid() and p.status = 'approved'));
create policy req_pro_update on support_requests for update using (
  professional_id = auth.uid() and status in ('open','accepted')
  and exists (select 1 from professional_profiles p where p.user_id = auth.uid() and p.status = 'approved'))
  with check (professional_id = auth.uid() and status in ('accepted','closed'));
