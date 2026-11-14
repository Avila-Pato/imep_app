-- Reacciones a los mensajes de las salas (como WhatsApp): una por persona y
-- mensaje. Las ven los miembros de la iglesia; cada uno pone o quita la suya
create table public.reacciones (
  mensaje_id uuid not null references public.mensajes on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- se guarda la iglesia para filtrar "en vivo" y las reglas
  iglesia_id uuid not null references public.iglesias on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '🙏', '😂', '😮', '🙌')),
  creado timestamptz not null default now(),
  primary key (mensaje_id, usuario_id)
);
create index reacciones_iglesia on public.reacciones (iglesia_id);

alter table public.reacciones enable row level security;

create policy "miembros ven reacciones" on public.reacciones
  for select to authenticated using (public.es_miembro(iglesia_id));

-- la iglesia tiene que ser la del mensaje (no se puede reaccionar a otra)
create policy "reaccionar" on public.reacciones
  for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and public.es_miembro(iglesia_id)
    and exists (
      select 1 from public.mensajes m
      where m.id = mensaje_id and m.iglesia_id = reacciones.iglesia_id
    )
  );
create policy "cambiar mi reaccion" on public.reacciones
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.mensajes m
      where m.id = mensaje_id and m.iglesia_id = reacciones.iglesia_id
    )
  );
create policy "quitar mi reaccion" on public.reacciones
  for delete to authenticated using (usuario_id = auth.uid());

alter publication supabase_realtime add table public.reacciones;
