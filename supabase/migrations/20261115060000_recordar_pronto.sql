-- Aviso 2 horas antes (cron "recordar-pronto", cada 15 minutos):
--   anuncio con hora: "Hoy: Noche de alabanza" · "A las 19:30 · Salon · Iglesia"
--     (a toda la iglesia que tiene activos los avisos de anuncios)
--   turno: "Hoy te toca: Palabra 🙌" · "A las 11:00 · Iglesia"
--     (a esa persona; sin hora propia, la del culto de ese dia)
-- Lo hace el servidor: llega aunque no haya abierto la app desde que se
-- publico el anuncio o le dieron el turno. Cada aviso sale UNA vez

-- lo que ya se aviso (para no repetir). Se limpia a los pocos dias
create table public.avisos_enviados (
  clave text primary key,
  enviado timestamptz not null default now()
);
alter table public.avisos_enviados enable row level security;
-- sin reglas: solo el servidor (service_role) la usa

-- La persona del turno por su nombre: el de su perfil o, si no tiene, el
-- de la iglesia (como en el resto de la app)
create function public.nombre_de_miembro(p_usuario uuid, p_iglesia uuid)
returns text language sql stable security definer set search_path = '' as $$
  select lower(trim(coalesce(nullif(trim(p.nombre), ''), m.nombre, '')))
  from public.miembros m
  left join public.perfiles p on p.id = m.usuario_id
  where m.usuario_id = p_usuario and m.iglesia_id = p_iglesia;
$$;
revoke execute on function public.nombre_de_miembro from public, anon, authenticated;
grant execute on function public.nombre_de_miembro to service_role;

-- Los avisos que tocan ahora (lo que empieza en las proximas 2 horas y aun
-- no se aviso). Los marca como enviados al devolverlos
create function public.avisos_pronto(p_zona text default 'America/Santiago')
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
      null::text as persona,
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
    select
      'turno:' || t.iglesia_id::text || ':' || t.fecha::text || ':' || t.rol
        || ':' || lower(trim(t.persona)),
      t.iglesia_id,
      lower(trim(t.persona)),
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
  where coalesce((d.avisos ->> p.tipo)::boolean, true)
    and (
      p.persona is null
      or public.nombre_de_miembro(m.usuario_id, m.iglesia_id) = p.persona
    );
end;
$$;
revoke execute on function public.avisos_pronto from public, anon, authenticated;
grant execute on function public.avisos_pronto to service_role;

-- "Mañana tienes turno" (la noche anterior): tambien encuentra a quien no
-- tiene perfil (antes solo cruzaba por el nombre del perfil)
create or replace function public.avisos_turnos_manana(p_zona text default 'America/Santiago')
returns table (token text, iglesia text, rol text, hora text, fecha date)
language sql stable security definer set search_path = '' as $$
  select d.token, i.nombre, coalesce(t.rol_nombre, t.rol), t.hora, t.fecha
  from public.turnos t
  join public.iglesias i on i.id = t.iglesia_id
  join public.miembros m on m.iglesia_id = t.iglesia_id
  join public.dispositivos d on d.usuario_id = m.usuario_id
  where t.fecha = (now() at time zone p_zona)::date + 1
    and public.nombre_de_miembro(m.usuario_id, m.iglesia_id) = lower(trim(t.persona))
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;
