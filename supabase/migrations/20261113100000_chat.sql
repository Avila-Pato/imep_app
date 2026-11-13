-- Chat de las salas: lo que escribe un hermano les llega a todos los de su
-- iglesia al instante (la tabla mensajes y sus reglas ya existen)

-- en vivo
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;
end $$;

-- el "upsert" del telefono (reintento del mismo mensaje) necesita poder
-- actualizar lo propio
create policy "editar lo propio" on public.mensajes
  for update to authenticated
  using (autor_id = auth.uid())
  with check (autor_id = auth.uid() and public.es_miembro(iglesia_id));

-- Notas de voz: chat/<iglesia>/<archivo>. Las suben los miembros de esa
-- iglesia; se escuchan con el enlace
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat', 'chat', true,
  5242880, -- 5 MB
  array['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/3gpp', 'audio/wav']
)
on conflict (id) do nothing;

create or replace function public.es_miembro_texto(p_iglesia text)
returns boolean language sql stable security definer set search_path = '' as $$
  -- (case: que un nombre de carpeta raro no rompa la conversion a uuid)
  select case when p_iglesia ~ '^[0-9a-f-]{36}$'
              then public.es_miembro(p_iglesia::uuid) else false end;
$$;
revoke execute on function public.es_miembro_texto from public, anon;
grant execute on function public.es_miembro_texto to authenticated;

create policy "miembros suben notas de voz" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat'
    and public.es_miembro_texto((storage.foldername(name))[1])
  );
create policy "miembros reemplazan notas de voz" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'chat'
    and owner = auth.uid()
  );
