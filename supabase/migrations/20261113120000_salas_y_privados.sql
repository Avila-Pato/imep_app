-- 1) Salas que crea el pastor (Jovenes, Dorcas...): la tabla y sus reglas ya
--    existen; ahora los hermanos se enteran al instante si se crea o cambia una
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'salas'
  ) then
    alter publication supabase_realtime add table public.salas;
  end if;
end $$;

-- 2) Chats privados (lider <-> hermano): cada mensaje solo lo ven quien lo
--    envia y quien lo recibe (no el resto de la iglesia)
create table public.privados (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  de uuid not null default auth.uid() references auth.users on delete cascade,
  para uuid not null references auth.users on delete cascade,
  autor text not null,        -- nombre de quien envia
  para_nombre text not null,  -- nombre de quien recibe
  texto text not null default '',
  datos jsonb not null default '{}', -- cita, versiculo, audio...
  creado timestamptz not null default now()
);
create index privados_de on public.privados (de, creado desc);
create index privados_para on public.privados (para, creado desc);

alter table public.privados enable row level security;

create policy "ver mis privados" on public.privados
  for select to authenticated
  using (de = auth.uid() or para = auth.uid());

-- solo a alguien de la misma iglesia
create policy "enviar privado" on public.privados
  for insert to authenticated
  with check (
    de = auth.uid()
    and public.es_miembro(iglesia_id)
    and exists (
      select 1 from public.miembros m
      where m.iglesia_id = privados.iglesia_id and m.usuario_id = privados.para
    )
  );

create policy "borrar mi privado" on public.privados
  for delete to authenticated
  using (de = auth.uid());

alter publication supabase_realtime add table public.privados;
