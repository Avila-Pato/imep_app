-- 1) En vivo: la app del hermano se entera al instante cuando cambian los
--    anuncios, el cronograma o los miembros de su iglesia (Supabase Realtime).
--    Realtime respeta las reglas RLS: cada uno solo recibe lo de su iglesia
do $$
declare
  t text;
begin
  foreach t in array array['anuncios', 'turnos', 'miembros'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 2) Push "Te asignaron un turno": los telefonos de la persona con ese
--    nombre en esa iglesia (el turno guarda el nombre). Solo Edge Functions
create function public.tokens_de_persona(
  p_iglesia uuid, p_nombre text, p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select d.token
  from public.miembros m
  join public.perfiles p on p.id = m.usuario_id
  join public.dispositivos d on d.usuario_id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and lower(trim(p.nombre)) = lower(trim(p_nombre))
    and m.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;
revoke execute on function public.tokens_de_persona from public, anon, authenticated;
grant execute on function public.tokens_de_persona to service_role;
