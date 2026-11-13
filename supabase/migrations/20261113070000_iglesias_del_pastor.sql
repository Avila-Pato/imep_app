-- El hermano ve TODAS las iglesias de su pastor (no solo la del codigo):
-- al unirse a una, queda unido como hermano a las demas del mismo pastor, y
-- cuando el pastor crea otra iglesia, sus hermanos quedan unidos a ella.
-- La sala del codigo es solo de la iglesia del codigo

-- Une a una persona (como hermano) a todas las iglesias de los pastores de
-- p_iglesia. No cambia a nadie que ya este (ni su rol ni su sala)
create function public.unir_a_iglesias_del_pastor(
  p_iglesia uuid, p_usuario uuid, p_nombre text default null
) returns void
language sql security definer set search_path = '' as $$
  insert into public.miembros (iglesia_id, usuario_id, rol, nombre)
  select distinct otra.iglesia_id, p_usuario, 'hermano'::public.rol_iglesia, p_nombre
  from public.miembros pastor
  join public.miembros otra
    on otra.usuario_id = pastor.usuario_id and otra.rol = 'pastor'
  where pastor.iglesia_id = p_iglesia
    and pastor.rol = 'pastor'
    and otra.iglesia_id <> p_iglesia
  on conflict (iglesia_id, usuario_id) do nothing;
$$;
revoke execute on function public.unir_a_iglesias_del_pastor from public, anon, authenticated;

-- unirse_con_codigo: igual que antes + las demas iglesias del pastor
create or replace function public.unirse_con_codigo(p_codigo text, p_nombre text default null)
returns table (iglesia jsonb, sala text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  inv public.invitaciones;
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  select * into inv from public.invitaciones where codigo = upper(trim(p_codigo));
  if not found then
    return;
  end if;

  insert into public.miembros (iglesia_id, usuario_id, rol, nombre, sala)
    values (inv.iglesia_id, auth.uid(), 'hermano', p_nombre,
            nullif(inv.sala, 'general'))
    on conflict (iglesia_id, usuario_id) do update
      set sala = coalesce(nullif(inv.sala, 'general'), public.miembros.sala),
          nombre = coalesce(excluded.nombre, public.miembros.nombre);

  perform public.unir_a_iglesias_del_pastor(inv.iglesia_id, auth.uid(), p_nombre);

  update public.invitaciones set usos = usos + 1 where codigo = inv.codigo;

  return query
    select to_jsonb(i), nullif(inv.sala, 'general')
    from public.iglesias i where i.id = inv.iglesia_id;
end;
$$;

-- guardar_iglesia: igual que antes + al crear una iglesia nueva, los
-- hermanos de las otras iglesias de este pastor quedan unidos a ella
create or replace function public.guardar_iglesia(
  p_id uuid, p_nombre text, p_lugar text, p_direccion text,
  p_lat double precision, p_lng double precision
) returns public.iglesias
language plpgsql security definer set search_path = '' as $$
declare
  v public.iglesias;
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  if exists (select 1 from public.iglesias where id = p_id) then
    if not public.es_pastor(p_id) then
      raise exception 'solo el pastor cambia la iglesia' using errcode = '42501';
    end if;
    update public.iglesias
      set nombre = p_nombre, lugar = coalesce(p_lugar, lugar),
          direccion = p_direccion, lat = p_lat, lng = p_lng, actualizado = now()
      where id = p_id
      returning * into v;
  else
    insert into public.iglesias (id, nombre, lugar, direccion, lat, lng, creada_por)
      values (p_id, p_nombre, coalesce(p_lugar, 'Templo principal'),
              p_direccion, p_lat, p_lng, auth.uid())
      returning * into v;
    insert into public.miembros (iglesia_id, usuario_id, rol)
      values (v.id, auth.uid(), 'pastor');
    -- sus hermanos (de sus otras iglesias) tambien ven la nueva
    insert into public.miembros (iglesia_id, usuario_id, rol, nombre)
      select distinct v.id, h.usuario_id, 'hermano'::public.rol_iglesia, h.nombre
      from public.miembros mia
      join public.miembros h on h.iglesia_id = mia.iglesia_id and h.rol = 'hermano'
      where mia.usuario_id = auth.uid() and mia.rol = 'pastor'
        and mia.iglesia_id <> v.id
      on conflict (iglesia_id, usuario_id) do nothing;
  end if;
  return v;
end;
$$;

revoke execute on function public.guardar_iglesia from public, anon;
revoke execute on function public.unirse_con_codigo from public, anon;
grant execute on function public.guardar_iglesia to authenticated;
grant execute on function public.unirse_con_codigo to authenticated;

-- Los hermanos que ya estaban unidos: tambien a las demas iglesias del pastor
select public.unir_a_iglesias_del_pastor(m.iglesia_id, m.usuario_id, m.nombre)
from public.miembros m
where m.rol = 'hermano';
