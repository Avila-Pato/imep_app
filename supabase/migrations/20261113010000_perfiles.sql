-- Perfil de cada persona: su nombre (como quiere que la llamen) y su foto.
-- Lo ven ella misma y quienes comparten una iglesia con ella (asi el pastor
-- sabe quien es cada miembro). El correo NO se guarda aqui: queda en auth

create table public.perfiles (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  nombre text check (char_length(nombre) between 1 and 80),
  foto text check (foto is null or foto ~ '^https://'),
  actualizado timestamptz not null default now()
);

-- ¿Esta persona comparte alguna iglesia conmigo?
create function public.comparte_iglesia(p_usuario uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.miembros yo
    join public.miembros otro on otro.iglesia_id = yo.iglesia_id
    where yo.usuario_id = auth.uid() and otro.usuario_id = p_usuario
  );
$$;

alter table public.perfiles enable row level security;

create policy "ver mi perfil y el de mi iglesia" on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.comparte_iglesia(id));
create policy "crear mi perfil" on public.perfiles
  for insert to authenticated with check (id = auth.uid());
create policy "cambiar mi perfil" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
