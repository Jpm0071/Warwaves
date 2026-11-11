-- Rode no Supabase: SQL Editor -> New query -> Run
create table if not exists public.admins (
  email      text primary key,
  granted_by text,
  created_at timestamptz not null default now(),
  constraint admins_email_lower check (email = lower(email))
);

alter table public.admins enable row level security;

-- Cada usuário logado só enxerga a própria linha; o dono enxerga todas.
drop policy if exists "admins_select" on public.admins;
create policy "admins_select" on public.admins for select to authenticated
  using ( email = lower(auth.jwt() ->> 'email')
          or lower(auth.jwt() ->> 'email') = 'pedromartinsjoao35@gmail.com' );

-- Só o dono pode adicionar e remover admins.
drop policy if exists "admins_insert_owner" on public.admins;
create policy "admins_insert_owner" on public.admins for insert to authenticated
  with check ( lower(auth.jwt() ->> 'email') = 'pedromartinsjoao35@gmail.com' );

drop policy if exists "admins_delete_owner" on public.admins;
create policy "admins_delete_owner" on public.admins for delete to authenticated
  using ( lower(auth.jwt() ->> 'email') = 'pedromartinsjoao35@gmail.com' );

-- =====================================================================
--  ADMINS PÚBLICOS (cadastro direto na tabela)
--  Troque os emails abaixo pelos reais (SEMPRE em minúsculas) e tire os "--"
--  das linhas de exemplo. Pode rodar de novo à vontade: não duplica.
--  Quem estiver aqui ganha o Painel ADM e ignora o anti-cheat.
-- =====================================================================
insert into public.admins (email, granted_by) values
  -- ('amigo1@gmail.com', 'pedromartinsjoao35@gmail.com'),
  -- ('amigo2@gmail.com', 'pedromartinsjoao35@gmail.com'),
  ('pedromartinsjoao35@gmail.com', 'pedromartinsjoao35@gmail.com')
on conflict (email) do nothing;

-- Ver todos os admins cadastrados
select email, granted_by, created_at from public.admins order by created_at;

-- Para remover alguém (descomente e ajuste):
-- delete from public.admins where email = 'amigo1@gmail.com';