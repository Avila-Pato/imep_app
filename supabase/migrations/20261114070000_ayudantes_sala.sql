-- Mas de una persona administra la sala: el lider (y el pastor) eligen
-- "ayudantes" entre los de la sala. Hacen lo mismo que el lider: avisos,
-- encuentros, palabra de la semana, aprobar peticiones y escribir en las
-- salas "solo el lider escribe". Como el lider, se guardan por su nombre
alter table public.salas
  add column ayudantes text[] not null default '{}'
    check (cardinality(ayudantes) <= 10);

-- ¿Esta persona guia la sala? (su nombre es el del lider, o uno de los
-- ayudantes si p_ayudantes)
create function public.guia_la_sala(
  p_iglesia uuid, p_sala text, p_ayudantes boolean default true
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.salas s
    join public.miembros m
      on m.iglesia_id = s.iglesia_id and m.usuario_id = auth.uid()
    left join public.perfiles p on p.id = m.usuario_id
    cross join lateral (
      select lower(trim(coalesce(nullif(trim(p.nombre), ''), m.nombre, ''))) as yo
    ) n
    where s.iglesia_id = p_iglesia and s.id = p_sala and n.yo <> ''
      and (
        n.yo = lower(trim(coalesce(s.lider, '')))
        or (p_ayudantes and n.yo in (
          select lower(trim(a)) from unnest(s.ayudantes) a
        ))
      )
  );
$$;
revoke execute on function public.guia_la_sala from public, anon;
grant execute on function public.guia_la_sala to authenticated;

-- "Solo el lider escribe": tambien sus ayudantes
create or replace function public.puede_escribir_en_sala(p_iglesia uuid, p_sala text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select not s.solo_lider
        or public.es_pastor(p_iglesia)
        or public.guia_la_sala(p_iglesia, p_sala)
    from public.salas s
    where s.iglesia_id = p_iglesia and s.id = p_sala
  ), true);
$$;

-- El lider (o el pastor / quien tiene el permiso "salas") elige a sus
-- ayudantes. Un ayudante no puede nombrar a otros
create function public.cambiar_ayudantes(
  p_iglesia uuid, p_sala text, p_nombres text[]
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
  if cardinality(limpios) > 10 then
    raise exception 'maximo 10 ayudantes';
  end if;
  update public.salas set ayudantes = limpios
  where iglesia_id = p_iglesia and id = p_sala;
  if not found then
    raise exception 'sala no encontrada';
  end if;
  return limpios;
end;
$$;
revoke execute on function public.cambiar_ayudantes from public, anon;
grant execute on function public.cambiar_ayudantes to authenticated;

-- Aprobar o rechazar peticiones: ademas del pastor y los lideres con
-- permiso, el lider de esa sala y sus ayudantes
create or replace function public.revisar_peticion(p_id uuid, p_estado text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_estado not in ('aprobada', 'rechazada') then
    raise exception 'estado no valido';
  end if;
  update public.peticiones
     set estado = p_estado, revisado = now()
   where id = p_id
     and (public.puede(iglesia_id, 'salas')
          or public.guia_la_sala(iglesia_id, sala));
  if not found then
    raise exception 'no puedes revisar esta peticion';
  end if;
end $$;
