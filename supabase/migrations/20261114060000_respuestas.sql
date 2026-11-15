-- Respuestas a lo que publica el lider en su sala:
--   encuentro (desayuno, salida, reunion): "voy" / "no"
--   versiculo para memorizar: "aprendido" (al ganar el juego)
-- Una por persona y publicacion. Las ven los miembros de la iglesia (el
-- lider ve quienes van); cada uno pone, cambia o quita la suya
create table public.respuestas (
  mensaje_id uuid not null references public.mensajes on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- se guarda la iglesia para filtrar "en vivo" y las reglas
  iglesia_id uuid not null references public.iglesias on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  valor text not null check (valor in ('voy', 'no', 'aprendido')),
  creado timestamptz not null default now(),
  primary key (mensaje_id, usuario_id)
);
create index respuestas_iglesia on public.respuestas (iglesia_id);

alter table public.respuestas enable row level security;
grant select, insert, update, delete on public.respuestas to authenticated;

create policy "miembros ven respuestas" on public.respuestas
  for select to authenticated using (public.es_miembro(iglesia_id));

-- la iglesia tiene que ser la del mensaje (no se puede responder en otra)
create policy "responder" on public.respuestas
  for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and public.es_miembro(iglesia_id)
    and exists (
      select 1 from public.mensajes m
      where m.id = mensaje_id and m.iglesia_id = respuestas.iglesia_id
    )
  );
create policy "cambiar mi respuesta" on public.respuestas
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.mensajes m
      where m.id = mensaje_id and m.iglesia_id = respuestas.iglesia_id
    )
  );
create policy "quitar mi respuesta" on public.respuestas
  for delete to authenticated using (usuario_id = auth.uid());

alter publication supabase_realtime add table public.respuestas;
