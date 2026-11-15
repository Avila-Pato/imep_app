-- Los telefonos de una persona por su nombre (avisos "Te nombraron líder de
-- la sala" y "Te asignaron un turno"). Antes solo cruzaba por el nombre del
-- PERFIL: quien no tenia perfil (o lo tenia sin nombre) nunca recibia el
-- aviso. Ahora usa el mismo nombre que el resto de la app: el del perfil o,
-- si no tiene, el que dio al unirse a la iglesia (nombre_de_miembro)
create or replace function public.tokens_de_persona(
  p_iglesia uuid, p_nombre text, p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select d.token
  from public.miembros m
  join public.dispositivos d on d.usuario_id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and public.nombre_de_miembro(m.usuario_id, m.iglesia_id) = lower(trim(p_nombre))
    and m.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;
revoke execute on function public.tokens_de_persona from public, anon, authenticated;
grant execute on function public.tokens_de_persona to service_role;
