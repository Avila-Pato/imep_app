-- Dias y horarios de culto de CADA iglesia (antes eran fijos en la app).
-- [{ "dia": 0, "hora": "11:00", "nombre": "Culto dominical" }, ...]
-- dia = 0 domingo ... 6 sabado. null = aun no los configura (la app usa
-- unos de ejemplo); [] = sin cultos fijos
alter table public.iglesias add column horarios jsonb;

-- guardar_iglesia ahora tambien recibe los horarios (p_horarios = null: no
-- los cambia). Se borra la version anterior para que no haya dos con el
-- mismo nombre (Supabase no sabria cual llamar)
drop function public.guardar_iglesia(uuid, text, text, text, double precision, double precision);

create function public.guardar_iglesia(
  p_id uuid, p_nombre text, p_lugar text, p_direccion text,
  p_lat double precision, p_lng double precision, p_horarios jsonb default null
) returns public.iglesias
language plpgsql security definer set search_path = '' as $$
declare
  v public.iglesias;
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  if p_horarios is not null and jsonb_typeof(p_horarios) <> 'array' then
    raise exception 'horarios invalidos' using errcode = '22023';
  end if;

  if exists (select 1 from public.iglesias where id = p_id) then
    if not public.es_pastor(p_id) then
      raise exception 'solo el pastor cambia la iglesia' using errcode = '42501';
    end if;
    update public.iglesias
      set nombre = p_nombre, lugar = coalesce(p_lugar, lugar),
          direccion = p_direccion, lat = p_lat, lng = p_lng,
          horarios = coalesce(p_horarios, horarios),
          actualizado = now()
      where id = p_id
      returning * into v;
  else
    insert into public.iglesias (id, nombre, lugar, direccion, lat, lng, horarios, creada_por)
      values (p_id, p_nombre, coalesce(p_lugar, 'Templo principal'),
              p_direccion, p_lat, p_lng, p_horarios, auth.uid())
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
grant execute on function public.guardar_iglesia to authenticated;

-- los hermanos se enteran al instante si el pastor cambia los horarios
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'iglesias'
  ) then
    alter publication supabase_realtime add table public.iglesias;
  end if;
end $$;
