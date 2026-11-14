-- El pastor (o quien tiene el permiso "roles") puede restringir a un hermano:
--   sin_chat:    no puede escribir en el chat de las salas
--   sin_oracion: no puede pedir oracion
-- Se cumple en el servidor (reglas RLS): aunque la app no lo mostrara, no
-- podria hacerlo. El hermano no puede quitarselo (solo el admin cambia
-- miembros). A un pastor no se le puede restringir
alter table public.miembros
  add column sin_chat boolean not null default false,
  add column sin_oracion boolean not null default false;

create function public.puede_hablar(p_iglesia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros
    where iglesia_id = p_iglesia and usuario_id = auth.uid() and not sin_chat
  );
$$;
create function public.puede_pedir_oracion(p_iglesia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros
    where iglesia_id = p_iglesia and usuario_id = auth.uid() and not sin_oracion
  );
$$;
revoke execute on function public.puede_hablar from public, anon;
revoke execute on function public.puede_pedir_oracion from public, anon;
grant execute on function public.puede_hablar to authenticated;
grant execute on function public.puede_pedir_oracion to authenticated;

-- chat: escribir (y editar lo propio) solo si no esta silenciado
drop policy "miembros escriben" on public.mensajes;
create policy "miembros escriben" on public.mensajes
  for insert to authenticated
  with check (
    autor_id = auth.uid() and public.es_miembro(iglesia_id)
    and public.puede_hablar(iglesia_id)
  );
drop policy "editar lo propio" on public.mensajes;
create policy "editar lo propio" on public.mensajes
  for update to authenticated
  using (autor_id = auth.uid())
  with check (
    autor_id = auth.uid() and public.es_miembro(iglesia_id)
    and public.puede_hablar(iglesia_id)
  );

-- oracion: pedir solo si no esta restringido
drop policy "pedir oracion" on public.peticiones;
create policy "pedir oracion" on public.peticiones
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and public.es_miembro(iglesia_id)
    and public.puede_pedir_oracion(iglesia_id)
    and estado = 'pendiente'
    and revisado is null
    and orando = 0
  );

-- El admin pone o quita las restricciones (nunca a un pastor)
create function public.restringir_miembro(
  p_iglesia uuid, p_usuario uuid, p_sin_chat boolean, p_sin_oracion boolean
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.puede(p_iglesia, 'roles') then
    raise exception 'sin permiso';
  end if;
  update public.miembros
     set sin_chat = p_sin_chat, sin_oracion = p_sin_oracion
   where iglesia_id = p_iglesia and usuario_id = p_usuario and rol <> 'pastor';
  if not found then
    raise exception 'no se puede restringir a esta persona';
  end if;
end $$;
revoke execute on function public.restringir_miembro from public, anon;
grant execute on function public.restringir_miembro to authenticated;

-- la lista de miembros ahora trae las restricciones
drop function public.miembros_de_iglesia(uuid);
create function public.miembros_de_iglesia(p_iglesia uuid)
returns table (
  usuario_id uuid, nombre text, rol public.rol_iglesia, sala text,
  avatar jsonb, unido timestamptz, sin_chat boolean, sin_oracion boolean
)
language sql stable security definer set search_path = '' as $$
  select m.usuario_id,
         coalesce(nullif(trim(p.nombre), ''), nullif(trim(m.nombre), ''), 'Hermano/a'),
         m.rol,
         m.sala,
         p.avatar,
         m.unido,
         m.sin_chat,
         m.sin_oracion
  from public.miembros m
  left join public.perfiles p on p.id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and public.es_miembro(p_iglesia)
  order by 2;
$$;
revoke execute on function public.miembros_de_iglesia from public, anon;
grant execute on function public.miembros_de_iglesia to authenticated;
