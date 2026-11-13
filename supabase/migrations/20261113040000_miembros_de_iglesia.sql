-- Miembros de una iglesia con su nombre (el de su perfil), para elegir a
-- quien sirve en el cronograma, dar cargos o elegir lider de sala.
-- Solo la pueden pedir los miembros de esa iglesia
create function public.miembros_de_iglesia(p_iglesia uuid)
returns table (usuario_id uuid, nombre text, rol public.rol_iglesia, sala text)
language sql stable security definer set search_path = '' as $$
  select m.usuario_id,
         coalesce(nullif(trim(p.nombre), ''), nullif(trim(m.nombre), ''), 'Hermano/a'),
         m.rol,
         m.sala
  from public.miembros m
  left join public.perfiles p on p.id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and public.es_miembro(p_iglesia)
  order by 2;
$$;
revoke execute on function public.miembros_de_iglesia from public, anon;
grant execute on function public.miembros_de_iglesia to authenticated;
