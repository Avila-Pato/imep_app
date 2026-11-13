-- La foto o chibi de cada persona se ve en el cronograma y en las salas, y
-- "Miembro desde" es la fecha en que se unio a la iglesia.
--   avatar: { "tipo": "chibi", "semilla": "Sofia", "estilo": "adventurer" }
--        o  { "tipo": "foto", "uri": "https://..." } (subida a Storage)

alter table public.perfiles add column avatar jsonb
  check (avatar is null or avatar ->> 'tipo' in ('chibi', 'foto'));

-- Fotos de perfil: avatares/<usuario>/<archivo>. Cualquiera con el enlace
-- las ve; cada uno solo sube o borra las suyas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatares', 'avatares', true,
  3145728, -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "cada uno sube su foto" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "cada uno borra su foto" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- miembros_de_iglesia ahora tambien trae el avatar y desde cuando esta
-- (cambia lo que devuelve: se borra y se crea de nuevo)
drop function public.miembros_de_iglesia(uuid);
create function public.miembros_de_iglesia(p_iglesia uuid)
returns table (
  usuario_id uuid, nombre text, rol public.rol_iglesia, sala text,
  avatar jsonb, unido timestamptz
)
language sql stable security definer set search_path = '' as $$
  select m.usuario_id,
         coalesce(nullif(trim(p.nombre), ''), nullif(trim(m.nombre), ''), 'Hermano/a'),
         m.rol,
         m.sala,
         p.avatar,
         m.unido
  from public.miembros m
  left join public.perfiles p on p.id = m.usuario_id
  where m.iglesia_id = p_iglesia
    and public.es_miembro(p_iglesia)
  order by 2;
$$;
revoke execute on function public.miembros_de_iglesia from public, anon;
grant execute on function public.miembros_de_iglesia to authenticated;

-- si alguien cambia su foto, su iglesia la ve al instante
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'perfiles'
  ) then
    alter publication supabase_realtime add table public.perfiles;
  end if;
end $$;
