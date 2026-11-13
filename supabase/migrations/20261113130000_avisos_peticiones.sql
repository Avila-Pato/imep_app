-- Aviso "Fulano pide oracion": a quienes aprueban peticiones en esa iglesia
-- (el pastor y los lideres con el permiso "salas"), menos a quien la pidio.
-- Va con el tipo de aviso "salas" (si lo apago, no le llega)
create function public.tokens_que_revisan(p_iglesia uuid, p_excluir uuid default null)
returns table (token text)
language sql stable security definer set search_path = '' as $$
  select d.token
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
    );
$$;
revoke execute on function public.tokens_que_revisan from public, anon, authenticated;
grant execute on function public.tokens_que_revisan to service_role;
