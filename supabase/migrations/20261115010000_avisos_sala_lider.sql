-- El lider de la sala y sus ayudantes son de la sala aunque no entraron con
-- la invitacion (los eligio el pastor): les llegan los avisos de esa sala
-- igual que a los demas. Misma funcion, misma firma (solo cambia el "where")
create or replace function public.tokens_de_sala(
  p_iglesia uuid, p_sala text, p_nombres text[], p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select distinct d.token
  from public.miembros m
  join public.dispositivos d on d.usuario_id = m.usuario_id
  left join public.perfiles p on p.id = m.usuario_id
  left join public.salas s on s.iglesia_id = m.iglesia_id and s.id = p_sala
  where m.iglesia_id = p_iglesia
    and d.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> 'salas')::boolean, true)
    and (
      p_sala = 'general' or m.sala = p_sala or m.rol = 'pastor'
      -- su lider y sus ayudantes (por su nombre)
      or lower(trim(coalesce(nullif(trim(p.nombre), ''), m.nombre, '')))
         in (
           select lower(trim(x))
           from unnest(array_append(coalesce(s.ayudantes, '{}'), s.lider)) x
           where coalesce(trim(x), '') <> ''
         )
    )
    and (
      p_nombres is null or cardinality(p_nombres) = 0
      or coalesce(nullif(trim(p.nombre), ''), trim(m.nombre)) = any (p_nombres)
    );
$$;
