-- Imagenes de anuncios y eventos (Supabase Storage).
-- Se guardan en anuncios/<iglesia_id>/<archivo>. Cualquiera con el enlace
-- puede verlas (asi las ve el hermano en su telefono), pero solo sube o
-- borra quien puede publicar anuncios en ESA iglesia

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anuncios', 'anuncios', true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- la primera carpeta del archivo es la iglesia
create function public.iglesia_de_archivo(p_nombre text) returns uuid
language sql stable set search_path = '' as $$
  select case
    when (storage.foldername(p_nombre))[1] ~ '^[0-9a-f-]{36}$'
    then ((storage.foldername(p_nombre))[1])::uuid
  end;
$$;

create policy "admin sube imagenes de anuncios" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anuncios'
    and public.puede(public.iglesia_de_archivo(name), 'anuncios')
  );

create policy "admin borra imagenes de anuncios" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anuncios'
    and public.puede(public.iglesia_de_archivo(name), 'anuncios')
  );
