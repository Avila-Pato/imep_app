-- Personas por su CUENTA, no por su nombre.
-- Antes el lider de una sala, sus ayudantes y la persona de un turno se
-- guardaban solo como texto ("Pato") y todo se cruzaba por nombre: si dos
-- hermanos se llaman igual (o alguien cambia su nombre) el aviso, los
-- permisos del lider o el recordatorio le llegaban a otro (o a nadie).
-- Ahora se guarda tambien su usuario:
--   salas.lider_id, salas.ayudantes_ids, turnos.persona_id
-- El nombre se queda (es lo que se muestra). Si la app no manda el usuario
-- (versiones viejas), la base de datos lo busca por el nombre, SOLO si en esa
-- iglesia hay una unica persona con ese nombre. Si no se puede saber, queda
-- vacio y se usa el nombre como antes.

alter table public.salas
  add column lider_id uuid references auth.users on delete set null,
  add column ayudantes_ids uuid[] not null default '{}';
alter table public.turnos
  add column persona_id uuid references auth.users on delete set null;
create index turnos_persona on public.turnos (persona_id);

-- La cuenta de quien se llama asi en esa iglesia (null si no hay o hay dos)
create function public.usuario_por_nombre(p_iglesia uuid, p_nombre text)
returns uuid language sql stable security definer set search_path = '' as $$
  select case when count(*) = 1 then (array_agg(m.usuario_id))[1] end
  from public.miembros m
  where m.iglesia_id = p_iglesia
    and coalesce(trim(p_nombre), '') <> ''
    and public.nombre_de_miembro(m.usuario_id, m.iglesia_id) = lower(trim(p_nombre));
$$;
revoke execute on function public.usuario_por_nombre from public, anon, authenticated;

-- ¿Esa cuenta es miembro de esa iglesia? (no se puede nombrar a un extraño)
create function public.es_miembro_de(p_iglesia uuid, p_usuario uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros m
    where m.iglesia_id = p_iglesia and m.usuario_id = p_usuario
  );
$$;
revoke execute on function public.es_miembro_de from public, anon, authenticated;

-- Salas: completa (o limpia) lider_id y ayudantes_ids
create function public.salas_cuentas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- lider: si cambio el nombre y la app no mando la cuenta, se busca
  if coalesce(trim(new.lider), '') = '' then
    new.lider_id := null;
  elsif tg_op = 'INSERT' and new.lider_id is null
     or tg_op = 'UPDATE' and new.lider is distinct from old.lider
        and new.lider_id is not distinct from old.lider_id then
    new.lider_id := public.usuario_por_nombre(new.iglesia_id, new.lider);
  end if;
  -- una cuenta que no es de la iglesia (se fue, o un dato malo): no cuenta
  if new.lider_id is not null
     and not public.es_miembro_de(new.iglesia_id, new.lider_id) then
    new.lider_id := public.usuario_por_nombre(new.iglesia_id, new.lider);
  end if;

  -- ayudantes: igual (cada nombre con su cuenta, si se sabe)
  if tg_op = 'INSERT' and cardinality(new.ayudantes_ids) = 0
     or tg_op = 'UPDATE' and new.ayudantes is distinct from old.ayudantes
        and new.ayudantes_ids is not distinct from old.ayudantes_ids then
    select coalesce(array_agg(u) filter (where u is not null), '{}')
      into new.ayudantes_ids
    from (
      select public.usuario_por_nombre(new.iglesia_id, a) as u
      from unnest(coalesce(new.ayudantes, '{}')) a
    ) x;
  end if;
  new.ayudantes_ids := coalesce((
    select array_agg(distinct u) from unnest(new.ayudantes_ids) u
    where public.es_miembro_de(new.iglesia_id, u)
  ), '{}');
  return new;
end;
$$;
create trigger salas_cuentas
  before insert or update on public.salas
  for each row execute function public.salas_cuentas();

-- Turnos: completa persona_id
create function public.turnos_cuentas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.persona_id is null
     or tg_op = 'UPDATE' and new.persona is distinct from old.persona
        and new.persona_id is not distinct from old.persona_id then
    new.persona_id := public.usuario_por_nombre(new.iglesia_id, new.persona);
  elsif not public.es_miembro_de(new.iglesia_id, new.persona_id) then
    new.persona_id := public.usuario_por_nombre(new.iglesia_id, new.persona);
  end if;
  return new;
end;
$$;
create trigger turnos_cuentas
  before insert or update on public.turnos
  for each row execute function public.turnos_cuentas();

-- Lo que ya existe: se completa con lo que se pueda saber
update public.salas set lider_id = public.usuario_por_nombre(iglesia_id, lider)
  where coalesce(trim(lider), '') <> '';
update public.salas s set ayudantes_ids = coalesce((
    select array_agg(u) from (
      select public.usuario_por_nombre(s.iglesia_id, a) as u
      from unnest(s.ayudantes) a
    ) x where u is not null
  ), '{}')
  where cardinality(s.ayudantes) > 0;
update public.turnos set persona_id = public.usuario_por_nombre(iglesia_id, persona);

-- ¿Esta cuenta es el lider (o ayudante) de esta sala? Por cuenta; por
-- nombre solo si la sala no tiene la cuenta (datos viejos o nombre repetido)
create function public.es_guia(
  s public.salas, p_usuario uuid, p_ayudantes boolean default true
) returns boolean language sql stable security definer set search_path = '' as $$
  select p_usuario is not null and (
    s.lider_id = p_usuario
    or (s.lider_id is null and coalesce(trim(s.lider), '') <> ''
        and public.nombre_de_miembro(p_usuario, s.iglesia_id) = lower(trim(s.lider)))
    or (p_ayudantes and (
      p_usuario = any (s.ayudantes_ids)
      -- algun ayudante sin cuenta conocida: por su nombre
      or (cardinality(s.ayudantes_ids) < cardinality(s.ayudantes)
          and public.nombre_de_miembro(p_usuario, s.iglesia_id)
              in (select lower(trim(a)) from unnest(s.ayudantes) a))
    ))
  );
$$;
revoke execute on function public.es_guia from public, anon, authenticated;

-- ¿Esta cuenta es la persona del turno?
create function public.es_del_turno(t public.turnos, p_usuario uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when t.persona_id is not null then t.persona_id = p_usuario
    else public.nombre_de_miembro(p_usuario, t.iglesia_id) = lower(trim(t.persona))
  end;
$$;
revoke execute on function public.es_del_turno from public, anon, authenticated;

-- ───────── Permisos del lider (ahora por cuenta) ─────────

create or replace function public.guia_la_sala(
  p_iglesia uuid, p_sala text, p_ayudantes boolean default true
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.salas s
    join public.miembros m
      on m.iglesia_id = s.iglesia_id and m.usuario_id = auth.uid()
    where s.iglesia_id = p_iglesia and s.id = p_sala
      and public.es_guia(s, auth.uid(), p_ayudantes)
  );
$$;

-- El lider (o el pastor) elige sus ayudantes: ahora con sus cuentas
drop function public.cambiar_ayudantes(uuid, text, text[]);
create function public.cambiar_ayudantes(
  p_iglesia uuid, p_sala text, p_nombres text[], p_ids uuid[] default null
) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  limpios text[];
begin
  if not (
    public.puede(p_iglesia, 'salas')
    or public.guia_la_sala(p_iglesia, p_sala, false)
  ) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct n), '{}') into limpios
  from (
    select regexp_replace(trim(x), '\s+', ' ', 'g') as n
    from unnest(coalesce(p_nombres, '{}')) x
  ) t
  where n <> '' and char_length(n) <= 80;
  if cardinality(limpios) > 10 or cardinality(coalesce(p_ids, '{}')) > 10 then
    raise exception 'maximo 10 ayudantes';
  end if;
  -- sin cuentas (app vieja): el trigger las busca por nombre
  update public.salas set
    ayudantes = limpios,
    ayudantes_ids = case when p_ids is null then ayudantes_ids else p_ids end
  where iglesia_id = p_iglesia and id = p_sala;
  if not found then
    raise exception 'sala no encontrada';
  end if;
  return limpios;
end;
$$;
revoke execute on function public.cambiar_ayudantes from public, anon;
grant execute on function public.cambiar_ayudantes to authenticated;

-- ───────── A quien avisar (ahora por cuenta) ─────────

-- Los telefonos de una cuenta (avisos "Te nombraron líder", "Te asignaron
-- un turno" cuando se sabe la cuenta)
create function public.tokens_de_usuario(
  p_iglesia uuid, p_usuario uuid, p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select d.token
  from public.dispositivos d
  where d.usuario_id = p_usuario
    and p_usuario is distinct from p_excluir
    and public.es_miembro_de(p_iglesia, p_usuario)
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;
revoke execute on function public.tokens_de_usuario from public, anon, authenticated;
grant execute on function public.tokens_de_usuario to service_role;

create or replace function public.tokens_de_sala(
  p_iglesia uuid, p_sala text, p_nombres text[], p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select distinct d.token
  from public.miembros m
  join public.dispositivos d on d.usuario_id = m.usuario_id
  left join public.perfiles p on p.id = m.usuario_id
  left join public.salas s on s.iglesia_id = m.iglesia_id and s.id = p_sala
  where m.iglesia_id = p_iglesia
    and d.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'salas')::boolean, true)
    and (
      p_sala = 'general' or m.sala = p_sala or m.rol = 'pastor'
      -- su lider y sus ayudantes (por su cuenta)
      or coalesce(public.es_guia(s, m.usuario_id), false)
    )
    and (
      p_nombres is null or cardinality(p_nombres) = 0
      or coalesce(nullif(trim(p.nombre), ''), trim(m.nombre)) = any (p_nombres)
    );
$$;

create or replace function public.tokens_que_revisan(
  p_iglesia uuid, p_excluir uuid default null, p_sala text default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select distinct d.token
  from public.dispositivos d
  join public.miembros m on m.usuario_id = d.usuario_id
  where m.iglesia_id = p_iglesia
    and d.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'salas')::boolean, true)
    and (
      m.rol = 'pastor'
      or exists (
        select 1 from public.cargos c
        where c.iglesia_id = p_iglesia and c.usuario_id = m.usuario_id
          and c.cargo = 'lider'
      )
      -- el lider de esa sala o uno de sus ayudantes
      or exists (
        select 1 from public.salas s
        where s.iglesia_id = p_iglesia and s.id = p_sala
          and public.es_guia(s, m.usuario_id)
      )
    );
$$;

-- "Mañana tienes turno" (la noche anterior)
create or replace function public.avisos_turnos_manana(p_zona text default 'America/Santiago')
returns table (token text, iglesia text, rol text, hora text, fecha date)
language sql stable security definer set search_path = '' as $$
  select d.token, i.nombre, coalesce(t.rol_nombre, t.rol), t.hora, t.fecha
  from public.turnos t
  join public.iglesias i on i.id = t.iglesia_id
  join public.miembros m on m.iglesia_id = t.iglesia_id
  join public.dispositivos d on d.usuario_id = m.usuario_id
  where t.fecha = (now() at time zone p_zona)::date + 1
    and public.es_del_turno(t, m.usuario_id)
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;

-- 2 horas antes (cron recordar-pronto): el turno, por cuenta
create or replace function public.avisos_pronto(p_zona text default 'America/Santiago')
returns table (token text, titulo text, cuerpo text, url text, iglesia_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_ahora timestamptz := now();
  v_hoy date := (now() at time zone p_zona)::date;
begin
  return query
  with eventos as (
    -- anuncios con hora (hoy o mañana temprano)
    select
      'anuncio:' || a.id::text as clave,
      a.iglesia_id as iglesia,
      null::uuid as turno,
      'anuncios' as tipo,
      ((a.fecha + a.hora::time) at time zone p_zona) as inicio,
      'Hoy: ' || a.titulo as titulo,
      concat_ws(' · ', 'A las ' || a.hora, nullif(trim(a.lugar), ''), i.nombre) as cuerpo,
      '/eventos' as url
    from public.anuncios a
    join public.iglesias i on i.id = a.iglesia_id
    where a.hora ~ '^\d{1,2}:\d{2}$'
      and a.fecha between v_hoy and v_hoy + 1
    union all
    -- turnos: su hora, o la del (primer) culto de ese dia de la semana
    -- (la clave sigue igual que antes: no se repiten los ya avisados)
    select
      'turno:' || t.iglesia_id::text || ':' || t.fecha::text || ':' || t.rol
        || ':' || lower(trim(t.persona)),
      t.iglesia_id,
      t.id,
      'turnos',
      ((t.fecha + h.hora::time) at time zone p_zona),
      'Hoy te toca: ' || coalesce(nullif(trim(t.rol_nombre), ''), t.rol) || ' 🙌',
      concat_ws(' · ', 'A las ' || h.hora, i.nombre),
      '/eventos?vista=cronograma'
    from public.turnos t
    join public.iglesias i on i.id = t.iglesia_id
    cross join lateral (
      select coalesce(
        nullif(trim(t.hora), ''),
        (select x ->> 'hora'
           from jsonb_array_elements(coalesce(i.horarios, '[]'::jsonb)) x
          where (x ->> 'dia')::int = extract(dow from t.fecha)::int
          order by x ->> 'hora'
          limit 1)
      ) as hora
    ) h
    where h.hora ~ '^\d{1,2}:\d{2}$'
      and t.fecha between v_hoy and v_hoy + 1
  ),
  proximos as (
    select e.* from eventos e
    where e.inicio > v_ahora
      and e.inicio <= v_ahora + interval '2 hours'
      and not exists (
        select 1 from public.avisos_enviados s where s.clave = e.clave
      )
  ),
  marcados as (
    insert into public.avisos_enviados (clave)
    select p.clave from proximos p
    on conflict do nothing
    returning clave
  )
  select d.token, p.titulo, p.cuerpo, p.url, p.iglesia
  from proximos p
  join marcados mk on mk.clave = p.clave
  join public.miembros m on m.iglesia_id = p.iglesia
  join public.dispositivos d on d.usuario_id = m.usuario_id
  left join public.turnos t on t.id = p.turno
  where coalesce((d.avisos ->> p.tipo)::boolean, true)
    and (p.turno is null or public.es_del_turno(t, m.usuario_id));
end;
$$;
