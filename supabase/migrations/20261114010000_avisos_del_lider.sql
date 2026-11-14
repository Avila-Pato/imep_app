-- Aviso o devocional del lider en una sala: la notificacion le llega a los
-- de esa sala (o a toda la iglesia si es la sala "general"), o solo a las
-- personas que eligio (por su nombre exacto). Respeta si apago "Mi sala"
create function public.tokens_de_sala(
  p_iglesia uuid, p_sala text, p_nombres text[], p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select distinct d.token
  from public.miembros m
  join public.dispositivos d on d.usuario_id = m.usuario_id
  left join public.perfiles p on p.id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and d.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'salas')::boolean, true)
    and (p_sala = 'general' or m.sala = p_sala or m.rol = 'pastor')
    and (
      p_nombres is null or cardinality(p_nombres) = 0
      or coalesce(nullif(trim(p.nombre), ''), trim(m.nombre)) = any (p_nombres)
    );
$$;
revoke execute on function public.tokens_de_sala from public, anon, authenticated;
grant execute on function public.tokens_de_sala to service_role;
