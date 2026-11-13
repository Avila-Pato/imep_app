-- Revisa un codigo de invitacion SIN unir a la persona: dice a que iglesia
-- (y sala) lleva, o nada si no existe. Lo usa la app para no dejar pasar
-- codigos inventados antes de que el hermano toque "Unirme"
create function public.verificar_codigo(p_codigo text)
returns table (iglesia text, sala text)
language sql stable security definer set search_path = '' as $$
  select i.nombre, nullif(v.sala, 'general')
  from public.invitaciones v
  join public.iglesias i on i.id = v.iglesia_id
  where v.codigo = upper(trim(p_codigo));
$$;
revoke execute on function public.verificar_codigo from public, anon;
grant execute on function public.verificar_codigo to authenticated;
