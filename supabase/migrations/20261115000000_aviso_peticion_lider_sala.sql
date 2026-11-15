-- Aviso "Fulano pide oracion": ademas del pastor y los lideres con cargo,
-- le llega al lider de la sala donde se pidio y a sus ayudantes (por su
-- nombre, como los guarda la sala). Sigue respetando si apago "Mi sala"
drop function public.tokens_que_revisan(uuid, uuid);

create function public.tokens_que_revisan(
  p_iglesia uuid, p_excluir uuid default null, p_sala text default null
)
returns table (token text)
language sql stable security definer set search_path = '' as $$
  select distinct d.token
  from public.dispositivos d
  join public.miembros m on m.usuario_id = d.usuario_id
  left join public.perfiles p on p.id = m.usuario_id
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
      -- el lider de esa sala o uno de sus ayudantes
      or exists (
        select 1 from public.salas s
        cross join lateral (
          select lower(trim(coalesce(nullif(trim(p.nombre), ''), m.nombre, ''))) as nombre
        ) n
        where s.iglesia_id = p_iglesia and s.id = p_sala and n.nombre <> ''
          and (
            n.nombre = lower(trim(coalesce(s.lider, '')))
            or n.nombre in (select lower(trim(a)) from unnest(s.ayudantes) a)
          )
      )
    );
$$;
revoke execute on function public.tokens_que_revisan from public, anon, authenticated;
grant execute on function public.tokens_que_revisan to service_role;

-- El lider de la sala (y sus ayudantes) ven las peticiones pendientes de
-- SU sala, para aprobarlas o rechazarlas (antes solo el pastor y los
-- lideres con cargo: le llegaba el aviso y no veia nada)
drop policy "ver peticiones" on public.peticiones;
create policy "ver peticiones" on public.peticiones
  for select to authenticated
  using (
    public.es_miembro(iglesia_id)
    and (estado = 'aprobada'
         or autor_id = auth.uid()
         or public.puede(iglesia_id, 'salas')
         or public.guia_la_sala(iglesia_id, sala))
  );
