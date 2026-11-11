-- =====================================================================
--  SISTEMA ANTI-CHEAT COMPLETO E DEFINITIVO (Lâmina das Ondas)
--  Instruções: Copie todo este bloco, cole no SQL Editor do Supabase e rode.
-- =====================================================================

-- ---------- 1) FUNÇÕES DE IDENTIDADE ----------
create or replace function public.is_game_owner() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'pedromartinsjoao35@gmail.com'
$$;

create or replace function public.is_game_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_game_owner()
      or exists (select 1 from public.admins
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- Tabela de jogadores (não altera se já existir)
create table if not exists public.jogadores (
  id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 80,
  wave int not null default 0,
  lvl int not null default 1,
  inv jsonb not null default '[{"t":"katana","r":0,"lv":1,"xp":0}]'::jsonb,
  accs jsonb not null default '[]'::jsonb,
  mats jsonb not null default '{"ore":0,"crystal":0,"essence":0,"core":0}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.jogadores add column if not exists updated_at timestamptz not null default now();

-- ---------- 2) CRIAÇÃO DAS TABELAS DE SUPORTE ----------
create table if not exists public.anticheat_log (
  id         bigserial primary key,
  user_id    uuid,
  email      text,
  reason     text not null,
  old_row    jsonb,
  new_row    jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.anticheat_bans (
  user_id    uuid primary key,
  email      text,
  reason     text,
  created_at timestamptz not null default now()
);

create table if not exists public.anticheat_state (
  user_id uuid not null,
  k       text not null,
  tokens  numeric not null,
  ts      timestamptz not null default now(),
  primary key (user_id, k)
);

-- Ativação de Segurança de Linha (RLS) nas tabelas do Anticheat
alter table public.anticheat_log   enable row level security;
alter table public.anticheat_bans  enable row level security;
alter table public.anticheat_state enable row level security;

-- Limpeza e recriação das políticas das tabelas de log/ban
drop policy if exists "ac_log_select"  on public.anticheat_log;
drop policy if exists "ac_log_delete"  on public.anticheat_log;
drop policy if exists "ac_ban_select"  on public.anticheat_bans;
drop policy if exists "ac_ban_insert"  on public.anticheat_bans;
drop policy if exists "ac_ban_delete"  on public.anticheat_bans;

create policy "ac_log_select" on public.anticheat_log  for select to authenticated using (public.is_game_owner());
create policy "ac_log_delete" on public.anticheat_log  for delete to authenticated using (public.is_game_owner());
create policy "ac_ban_select" on public.anticheat_bans for select to authenticated using (public.is_game_owner());
create policy "ac_ban_insert" on public.anticheat_bans for insert to authenticated with check (public.is_game_owner());
create policy "ac_ban_delete" on public.anticheat_bans for delete to authenticated using (public.is_game_owner());

-- ---------- 3) CONFIGURAÇÃO DE SEGURANÇA DA TABELA JOGADORES ----------
alter table public.jogadores enable row level security;

do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'jogadores' loop
    execute format('drop policy %I on public.jogadores', r.policyname);
  end loop;
end $$;

create policy "jogadores_select_own" on public.jogadores for select to authenticated using (id = auth.uid());
create policy "jogadores_insert_own" on public.jogadores for insert to authenticated with check (id = auth.uid());
create policy "jogadores_update_own" on public.jogadores for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- 4) SISTEMA DE BALDE DE FICHAS (RATE LIMIT INTERNO) ----------
create or replace function public.ac_take(
  p_uid uuid, p_key text, p_amount numeric, p_cap numeric, p_rate numeric
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_tokens numeric;
  v_ts     timestamptz;
begin
  if p_amount is null or p_amount <= 0 then return true; end if;

  select tokens, ts into v_tokens, v_ts
    from public.anticheat_state where user_id = p_uid and k = p_key;

  if not found then
    v_tokens := p_cap;
  else
    v_tokens := least(p_cap, v_tokens + extract(epoch from (now() - v_ts)) * p_rate);
  end if;

  if p_amount > v_tokens then
    insert into public.anticheat_state(user_id, k, tokens, ts) values (p_uid, p_key, v_tokens, now())
      on conflict (user_id, k) do update set tokens = excluded.tokens, ts = excluded.ts;
    return false;
  end if;

  insert into public.anticheat_state(user_id, k, tokens, ts) values (p_uid, p_key, v_tokens - p_amount, now())
    on conflict (user_id, k) do update set tokens = excluded.tokens, ts = excluded.ts;
  return true;
end $$;

revoke execute on function public.ac_take(uuid, text, numeric, numeric, numeric) from public, anon, authenticated;

-- ---------- 5) FUNÇÕES AUXILIARES DE PARSING DE ESTATÍSTICAS ----------
create or replace function public.ac_inv_stats(p jsonb, out n int, out lv numeric, out r numeric, out ok boolean)
language plpgsql immutable as $$
begin
  if p is null or jsonb_typeof(p) <> 'array' then
    n := 0; lv := 0; r := 0; ok := false; return;
  end if;
  select count(*)::int,
         coalesce(sum((e ->> 'lv')::numeric), 0),
         coalesce(sum((e ->> 'r')::numeric), 0),
         coalesce(bool_and(coalesce(
           (e ->> 't') = any (array['katana','gun','triple','axe','daggers','spear','club','bow','glaive','scythe','chaos'])
           and (e ->> 'r')::int between 0 and 4
           and (e ->> 'lv')::int between 1 and 200
           and coalesce((e ->> 'xp')::numeric, 0) >= 0
         , false)), true)
    into n, lv, r, ok
    from jsonb_array_elements(p) as t(e);
end $$;

create or replace function public.ac_acc_stats(p jsonb, out n int, out nd int, out ok boolean)
language plpgsql immutable as $$
begin
  if p is null or jsonb_typeof(p) <> 'array' then
    n := 0; nd := 0; ok := false; return;
  end if;
  select count(*)::int, count(distinct x)::int,
         coalesce(bool_and(x::int between 0 and 10), true)
    into n, nd, ok
    from jsonb_array_elements_text(p) as t(x);
end $$;

-- ---------- 6) GATILHO E LOGICA FINAL BLINDADA ----------
create or replace function public.ac_check_progress()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c_max_strikes constant int := 6;                 
  c_defaults constant jsonb := jsonb_build_object(
    'coins', 80, 'wave', 0, 'lvl', 1,
    'inv',  '[{"t":"katana","r":0,"lv":1,"xp":0}]'::jsonb,
    'accs', '[]'::jsonb,
    'mats', jsonb_build_object('ore',0,'crystal',0,'essence',0,'core',0));
  
  v_uid     uuid := auth.uid();
  v_email   text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_reason  text;
  v_new     jsonb := to_jsonb(NEW);
  v_old     jsonb;
  v_w       numeric;
  v_inc     numeric;
  v_mw      numeric;
  v_d       numeric;
  v_strikes int;
  k         text;
  ni record; oi record; na record; oa record;
begin
  if v_uid is null then return NEW; end if;

  if exists (select 1 from public.anticheat_bans where user_id = v_uid) then
    if TG_OP = 'UPDATE' then return OLD; else return null; end if;
  end if;

  if public.is_game_admin() then
    NEW.updated_at := now();
    return NEW;
  end if;

  if TG_OP = 'INSERT' and exists (select 1 from public.jogadores where id = NEW.id) then
    return NEW;
  end if;

  NEW.updated_at := now();

  begin
    ---------------- 1) Estrutura e Limites Absolutos ----------------
    if coalesce(NEW.coins, -1) < 0 or NEW.coins > 99999999 then
      v_reason := 'moedas fora do limite plausível (' || coalesce(NEW.coins::text, 'null') || ')';
    elsif coalesce(NEW.wave, -1) < 0 or NEW.wave > 1000 then
      v_reason := 'onda fora do limite máximo do jogo (' || coalesce(NEW.wave::text, 'null') || ')';
    elsif coalesce(NEW.lvl, 0) < 1 or NEW.lvl > (NEW.wave * 3) + 10 then
      v_reason := 'nível desproporcional para a onda atual (nível ' || coalesce(NEW.lvl::text, 'null') || ', onda ' || NEW.wave || ')';
    end if;

    if v_reason is null then
      select * into ni from public.ac_inv_stats(v_new -> 'inv');
      select * into na from public.ac_acc_stats(v_new -> 'accs');
      
      if not ni.ok or ni.n < 1 or ni.n > 50 then
        v_reason := 'estrutura de inventário corrompida ou tamanho ilegal (máx 50)';
      elsif not na.ok or na.n <> na.nd or na.n > 11 then
        v_reason := 'acessórios duplicados ou IDs inválidos encontrados';
      end if;
    end if;

    if v_reason is null then
      foreach k in array array['ore','crystal','essence','core'] loop
        if coalesce((v_new -> 'mats' ->> k)::numeric, -1) < 0 or (v_new -> 'mats' ->> k)::numeric > 999999 then
          v_reason := 'quantidade de material inválida ou extrapolada para o item: ' || k;
          exit;
        end if;
      end loop;
    end if;

    ---------------- 2) Primeira Gravação ----------------
    if v_reason is null and TG_OP = 'INSERT' then
      if NEW.wave > 0 or NEW.coins > 80 or ni.n > 1 or NEW.lvl > 1 then
        v_reason := 'tentativa de iniciar conta nova com progresso injetado';
      end if;
    end if;

    ---------------- 3) Ritmo de Progresso (Só UPDATE) ----------------
    if v_reason is null and TG_OP = 'UPDATE' then
      v_old := to_jsonb(OLD);
      select * into oi from public.ac_inv_stats(v_old -> 'inv');
      select * into oa from public.ac_acc_stats(v_old -> 'accs');

      v_w   := greatest(NEW.wave, OLD.wave) + 1;
      
      v_inc := (2.0 * ((6 + 2 * v_w) * (5 + v_w) + 30 + 10 * v_w) + 200 + 15 * v_w) * 2.5; -- 2.5x: comporta bônus de modos difíceis (até 2x) + acessórios de moedas
      v_mw  := ((6 + 2 * v_w) * 2 + 12 + v_w) * 1.2; 

      if not public.ac_take(v_uid, 'wave', greatest(NEW.wave - OLD.wave, 0), 3, 1.0 / 10) then
        v_reason := 'ondas passadas rápido demais pelo cliente (' || OLD.wave || ' -> ' || NEW.wave || ')';
      elsif not public.ac_take(v_uid, 'coins', greatest(NEW.coins - OLD.coins, 0), v_inc * 2 + 1000, v_inc / 10.0) then
        v_reason := 'ganho de moedas acima do teto matemático da onda (+' || (NEW.coins - OLD.coins) || ')';
      elsif not public.ac_take(v_uid, 'wlv', greatest(ni.lv - oi.lv, 0), 20, 0.5) then
        v_reason := 'níveis de armas subiram sem tempo de recarga lógico (+' || (ni.lv - oi.lv) || ')';
      elsif not public.ac_take(v_uid, 'wrar', greatest(ni.r - oi.r, 0), 10, 0.2) then
        v_reason := 'evolução de raridade de arma rápida demais (+' || (ni.r - oi.r) || ')';
      elsif not public.ac_take(v_uid, 'winv', greatest(ni.n - oi.n, 0), 6, 0.5) then
        v_reason := 'quantidade anormal de armas adicionadas ao inventário (+' || (ni.n - oi.n) || ')';
      elsif not public.ac_take(v_uid, 'acc', greatest(na.n - oa.n, 0), 2, 1.0 / 60) then
        v_reason := 'ganho ilegal de acessórios sem matar chefes de raid (+' || (na.n - oa.n) || ')';
      end if;

      if v_reason is null then
        foreach k in array array['ore','crystal','essence','core'] loop
          v_d := (v_new -> 'mats' -> k)::numeric - coalesce((v_old -> 'mats' -> k)::numeric, 0);
          if v_d > 0 then
            if not public.ac_take(v_uid, 'mat_' || k, v_d, v_mw * 2 + 10, v_mw / 10.0) then
              v_reason := 'ritmo de drop de material violado para: ' || k || ' (+' || v_d || ')';
              exit;
            end if;
          end if;
        end loop;
      end if;
    end if;

  exception when others then
    v_reason := 'tentativa de bypass via payload malformado: ' || sqlerrm;
  end;

  ---------------- 4) Veredito e Aplicação do Alerta/Ban ----------------
  if v_reason is not null then
    insert into public.anticheat_log(user_id, email, reason, old_row, new_row)
    values (v_uid, v_email, v_reason, case when TG_OP = 'UPDATE' then to_jsonb(OLD) end, to_jsonb(NEW));

    select count(*) into v_strikes from public.anticheat_log
     where user_id = v_uid and created_at > now() - interval '24 hours';

    if v_strikes >= c_max_strikes then
      insert into public.anticheat_bans(user_id, email, reason)
      values (v_uid, v_email, 'Ban Automático: ' || v_strikes || ' violações detectadas em menos de 24 horas.')
      on conflict (user_id) do nothing;
    end if;

    if TG_OP = 'UPDATE' then
      return OLD;                                   
    end if;
    return null;                                    
  end if;

  return NEW;
end $$;

-- Vincular novamente o gatilho atualizado à tabela jogadores
drop trigger if exists ac_check_progress on public.jogadores;
create trigger ac_check_progress
  before insert or update on public.jogadores
  for each row execute function public.ac_check_progress();