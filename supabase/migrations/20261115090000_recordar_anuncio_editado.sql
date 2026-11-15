-- Anuncio editado o turno con otra hora: el recordatorio de 2 horas antes
-- vuelve a salir a la hora nueva. Antes se anotaba solo por el anuncio
-- y, si ya se habia avisado, no se avisaba de nuevo.
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
      -- con su dia y hora: si lo cambian, se recuerda de nuevo a la hora nueva
      'anuncio:' || a.id::text || ':' || a.fecha::text || ':' || a.hora as clave,
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
    -- (con su hora: si se la cambian, se recuerda a la hora nueva)
    select
      'turno:' || t.iglesia_id::text || ':' || t.fecha::text || ':' || t.rol
        || ':' || lower(trim(t.persona)) || ':' || h.hora,
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
