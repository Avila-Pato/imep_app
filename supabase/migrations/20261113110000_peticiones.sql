-- Peticiones de oracion: un hermano la pide, el pastor (o un lider) la
-- aprueba o rechaza, y la aprobada se ve en el muro de su sala 24 horas.
--   pendiente: la ven quien la pidio y quien aprueba
--   aprobada:  la ven todos los miembros
--   rechazada: solo quien la pidio (y quien aprueba)

create table public.peticiones (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  sala text not null default 'general',
  autor_id uuid not null default auth.uid() references auth.users on delete cascade,
  autor text not null,
  cita text not null default '',
  mostrar_cita boolean not null default false,
  texto text not null check (char_length(texto) between 1 and 2000),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada')),
  revisado timestamptz, -- desde aqui corren las 24 h del muro
  orando int not null default 0,
  creado timestamptz not null default now()
);
create index peticiones_iglesia on public.peticiones (iglesia_id, creado desc);

-- quien marco "Estoy orando" (uno por persona)
create table public.peticiones_orando (
  peticion_id uuid not null references public.peticiones on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (peticion_id, usuario_id)
);

alter table public.peticiones enable row level security;
alter table public.peticiones_orando enable row level security;

create policy "ver peticiones" on public.peticiones
  for select to authenticated
  using (
    public.es_miembro(iglesia_id)
    and (estado = 'aprobada'
         or autor_id = auth.uid()
         or public.puede(iglesia_id, 'salas'))
  );
-- se pide siempre "pendiente": aprobar es solo de quien revisa
create policy "pedir oracion" on public.peticiones
  for insert to authenticated
  with check (
    autor_id = auth.uid()
    and public.es_miembro(iglesia_id)
    and estado = 'pendiente'
    and revisado is null
    and orando = 0
  );
create policy "borrar la propia" on public.peticiones
  for delete to authenticated
  using (autor_id = auth.uid() or public.puede(iglesia_id, 'salas'));

-- Aprobar o rechazar (pastor o lider)
create function public.revisar_peticion(p_id uuid, p_estado text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_estado not in ('aprobada', 'rechazada') then
    raise exception 'estado no valido';
  end if;
  update public.peticiones
     set estado = p_estado, revisado = now()
   where id = p_id and public.puede(iglesia_id, 'salas');
  if not found then
    raise exception 'no puedes revisar esta peticion';
  end if;
end $$;
revoke execute on function public.revisar_peticion from public, anon;
grant execute on function public.revisar_peticion to authenticated;

-- "Estoy orando" / dejar de orar (cuenta una vez por persona)
create function public.orar_por(p_id uuid, p_orando boolean)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_iglesia uuid;
  v_total int;
begin
  select iglesia_id into v_iglesia from public.peticiones
   where id = p_id and estado = 'aprobada';
  if v_iglesia is null or not public.es_miembro(v_iglesia) then
    raise exception 'peticion no disponible';
  end if;
  if p_orando then
    insert into public.peticiones_orando (peticion_id, usuario_id)
    values (p_id, auth.uid()) on conflict do nothing;
  else
    delete from public.peticiones_orando
     where peticion_id = p_id and usuario_id = auth.uid();
  end if;
  select count(*) into v_total from public.peticiones_orando where peticion_id = p_id;
  update public.peticiones set orando = v_total where id = p_id;
  return v_total;
end $$;
revoke execute on function public.orar_por from public, anon;
grant execute on function public.orar_por to authenticated;

-- en vivo (el hermano ve al instante que se aprobo; el pastor, que llego una)
alter publication supabase_realtime add table public.peticiones;
