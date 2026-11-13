-- Congrega: esquema inicial
-- Todo lo "de la iglesia" lleva iglesia_id. Quien ve que lo deciden las
-- reglas RLS: solo los miembros de una iglesia ven lo suyo, y solo el pastor
-- (o quien tenga un cargo con ese permiso) lo cambia.

-- ───────────────────────── Iglesias y miembros ─────────────────────────

create type public.rol_iglesia as enum ('pastor', 'hermano');

create table public.iglesias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  lugar text not null default 'Templo principal',
  direccion text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  creada_por uuid not null default auth.uid() references auth.users on delete cascade,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

-- El rol es por iglesia: se puede ser pastor en una y hermano en otra
create table public.miembros (
  iglesia_id uuid not null references public.iglesias on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  rol public.rol_iglesia not null default 'hermano',
  nombre text, -- como se muestra en la iglesia
  sala text, -- sala a la que se unio con su invitacion
  unido timestamptz not null default now(),
  primary key (iglesia_id, usuario_id)
);
create index miembros_usuario on public.miembros (usuario_id);

-- Cargos que da el pastor (secretaria, servicio, comunicaciones, lider)
create table public.cargos (
  iglesia_id uuid not null,
  usuario_id uuid not null,
  cargo text not null check (cargo in ('secretaria', 'servicio', 'comunicaciones', 'lider')),
  primary key (iglesia_id, usuario_id, cargo),
  foreign key (iglesia_id, usuario_id)
    references public.miembros (iglesia_id, usuario_id) on delete cascade
);

-- Codigo que reparte el pastor: CONGREGA-4K7Q. sala = 'general' es la iglesia
create table public.invitaciones (
  codigo text primary key check (codigo ~ '^[A-HJKMNP-Z2-9]{4}$'),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  sala text not null default 'general',
  usos integer not null default 0,
  creado timestamptz not null default now(),
  unique (iglesia_id, sala)
);

-- ───────────────────────── Contenido de cada iglesia ─────────────────────────

create table public.salas (
  id text not null, -- el id que usa la app (ej: "jovenes")
  iglesia_id uuid not null references public.iglesias on delete cascade,
  label text not null,
  descripcion text not null default '',
  icono text not null default 'people',
  tono text,
  lider text,
  funciones jsonb not null default '{}',
  creado timestamptz not null default now(),
  primary key (iglesia_id, id)
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  sala text not null,
  autor_id uuid not null default auth.uid() references auth.users on delete cascade,
  autor text not null,
  texto text not null default '',
  datos jsonb not null default '{}', -- cita, versiculo, audio, tipo, titulo...
  creado timestamptz not null default now()
);
create index mensajes_sala on public.mensajes (iglesia_id, sala, creado desc);

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  autor_id uuid default auth.uid() references auth.users on delete set null,
  categoria text not null,
  titulo text not null,
  descripcion text not null default '',
  fecha date not null,
  hora text,
  lugar text,
  detalle text,
  imagen text,
  imagen_aspecto real,
  creado timestamptz not null default now()
);
create index anuncios_iglesia on public.anuncios (iglesia_id, fecha);

create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  fecha date not null,
  rol text not null,
  persona text not null,
  hora text
);
create index turnos_iglesia on public.turnos (iglesia_id, fecha);

create table public.predicaciones (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  fecha date not null,
  culto text not null,
  titulo text not null,
  predicador text not null,
  cita text not null,
  resumen text
);

-- ───────────────────────── Quien puede que ─────────────────────────
-- security definer: leen miembros sin pasar por sus propias reglas (evita
-- que una regla se llame a si misma)

create function public.es_miembro(p_iglesia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros
    where iglesia_id = p_iglesia and usuario_id = auth.uid()
  );
$$;

create function public.es_pastor(p_iglesia uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros
    where iglesia_id = p_iglesia and usuario_id = auth.uid() and rol = 'pastor'
  );
$$;

-- Igual que CARGOS en la app: que permite cada cargo
create function public.puede(p_iglesia uuid, p_permiso text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_pastor(p_iglesia) or exists (
    select 1 from public.cargos c
    where c.iglesia_id = p_iglesia and c.usuario_id = auth.uid()
      and p_permiso = any (case c.cargo
        when 'secretaria' then array['cronograma', 'anuncios', 'roles']
        when 'servicio' then array['cronograma']
        when 'comunicaciones' then array['anuncios']
        when 'lider' then array['salas']
      end)
  );
$$;

alter table public.iglesias enable row level security;
alter table public.miembros enable row level security;
alter table public.cargos enable row level security;
alter table public.invitaciones enable row level security;
alter table public.salas enable row level security;
alter table public.mensajes enable row level security;
alter table public.anuncios enable row level security;
alter table public.turnos enable row level security;
alter table public.predicaciones enable row level security;

-- Iglesias: las ven sus miembros, las cambia o borra su pastor.
-- Se crean con guardar_iglesia (asi el creador queda como pastor)
create policy "miembros ven su iglesia" on public.iglesias
  for select to authenticated using (public.es_miembro(id));
create policy "pastor cambia su iglesia" on public.iglesias
  for update to authenticated using (public.es_pastor(id));
create policy "pastor borra su iglesia" on public.iglesias
  for delete to authenticated using (public.es_pastor(id));

-- Miembros: se ven entre ellos; el pastor (o "roles") los administra;
-- cada uno puede salirse
create policy "miembros se ven" on public.miembros
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin cambia miembros" on public.miembros
  for update to authenticated using (public.puede(iglesia_id, 'roles'))
  with check (rol = 'hermano' or public.es_pastor(iglesia_id));
create policy "salir o sacar" on public.miembros
  for delete to authenticated
  using (usuario_id = auth.uid() or public.puede(iglesia_id, 'roles'));

create policy "miembros ven cargos" on public.cargos
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin da cargos" on public.cargos
  for insert to authenticated with check (public.puede(iglesia_id, 'roles'));
create policy "admin quita cargos" on public.cargos
  for delete to authenticated using (public.puede(iglesia_id, 'roles'));

-- Invitaciones: solo el pastor las ve (los hermanos entran con unirse_con_codigo)
create policy "pastor ve codigos" on public.invitaciones
  for select to authenticated using (public.es_pastor(iglesia_id));
create policy "pastor borra codigos" on public.invitaciones
  for delete to authenticated using (public.es_pastor(iglesia_id));

-- Salas
create policy "miembros ven salas" on public.salas
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin crea salas" on public.salas
  for insert to authenticated with check (public.puede(iglesia_id, 'salas'));
create policy "admin cambia salas" on public.salas
  for update to authenticated using (public.puede(iglesia_id, 'salas'));
create policy "admin borra salas" on public.salas
  for delete to authenticated using (public.puede(iglesia_id, 'salas'));

-- Mensajes: los miembros leen y escriben; cada uno borra los suyos
create policy "miembros leen mensajes" on public.mensajes
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "miembros escriben" on public.mensajes
  for insert to authenticated
  with check (autor_id = auth.uid() and public.es_miembro(iglesia_id));
create policy "borrar lo propio" on public.mensajes
  for delete to authenticated
  using (autor_id = auth.uid() or public.puede(iglesia_id, 'salas'));

-- Anuncios, turnos y predicaciones: los ven los miembros, los cambia quien
-- tiene el permiso
create policy "miembros ven anuncios" on public.anuncios
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin escribe anuncios" on public.anuncios
  for all to authenticated
  using (public.puede(iglesia_id, 'anuncios'))
  with check (public.puede(iglesia_id, 'anuncios'));

create policy "miembros ven turnos" on public.turnos
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin escribe turnos" on public.turnos
  for all to authenticated
  using (public.puede(iglesia_id, 'cronograma'))
  with check (public.puede(iglesia_id, 'cronograma'));

create policy "miembros ven predicaciones" on public.predicaciones
  for select to authenticated using (public.es_miembro(iglesia_id));
create policy "admin escribe predicaciones" on public.predicaciones
  for all to authenticated
  using (public.puede(iglesia_id, 'anuncios'))
  with check (public.puede(iglesia_id, 'anuncios'));

-- ───────────────────────── Funciones que llama la app ─────────────────────────

-- Crea la iglesia (quien la crea queda como pastor) o la actualiza si ya existe
create function public.guardar_iglesia(
  p_id uuid, p_nombre text, p_lugar text, p_direccion text,
  p_lat double precision, p_lng double precision
) returns public.iglesias
language plpgsql security definer set search_path = '' as $$
declare
  v public.iglesias;
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  if exists (select 1 from public.iglesias where id = p_id) then
    if not public.es_pastor(p_id) then
      raise exception 'solo el pastor cambia la iglesia' using errcode = '42501';
    end if;
    update public.iglesias
      set nombre = p_nombre, lugar = coalesce(p_lugar, lugar),
          direccion = p_direccion, lat = p_lat, lng = p_lng, actualizado = now()
      where id = p_id
      returning * into v;
  else
    insert into public.iglesias (id, nombre, lugar, direccion, lat, lng, creada_por)
      values (p_id, p_nombre, coalesce(p_lugar, 'Templo principal'),
              p_direccion, p_lat, p_lng, auth.uid())
      returning * into v;
    insert into public.miembros (iglesia_id, usuario_id, rol)
      values (v.id, auth.uid(), 'pastor');
  end if;
  return v;
end;
$$;

-- El pastor crea (o renueva) el codigo de la iglesia o de una sala.
-- Renovar borra el anterior
create function public.generar_codigo(p_iglesia uuid, p_sala text default 'general')
returns public.invitaciones
language plpgsql security definer set search_path = '' as $$
declare
  letras constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v public.invitaciones;
begin
  if not public.es_pastor(p_iglesia) then
    raise exception 'solo el pastor crea codigos' using errcode = '42501';
  end if;
  delete from public.invitaciones where iglesia_id = p_iglesia and sala = p_sala;
  loop
    v_codigo := '';
    for i in 1..4 loop
      v_codigo := v_codigo || substr(letras, 1 + floor(random() * length(letras))::int, 1);
    end loop;
    begin
      insert into public.invitaciones (codigo, iglesia_id, sala)
        values (v_codigo, p_iglesia, p_sala)
        returning * into v;
      return v;
    exception when unique_violation then
      -- ese codigo ya existe en otra iglesia: probar otro
    end;
  end loop;
end;
$$;

-- Un hermano se une con el codigo: queda como miembro (y en la sala, si el
-- codigo es de una). Devuelve la iglesia y la sala; nada si no sirve
create function public.unirse_con_codigo(p_codigo text, p_nombre text default null)
returns table (iglesia jsonb, sala text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  inv public.invitaciones;
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;

  select * into inv from public.invitaciones where codigo = upper(trim(p_codigo));
  if not found then
    return;
  end if;

  insert into public.miembros (iglesia_id, usuario_id, rol, nombre, sala)
    values (inv.iglesia_id, auth.uid(), 'hermano', p_nombre,
            nullif(inv.sala, 'general'))
    on conflict (iglesia_id, usuario_id) do update
      set sala = coalesce(nullif(inv.sala, 'general'), public.miembros.sala),
          nombre = coalesce(excluded.nombre, public.miembros.nombre);

  update public.invitaciones set usos = usos + 1 where codigo = inv.codigo;

  return query
    select to_jsonb(i), nullif(inv.sala, 'general')
    from public.iglesias i where i.id = inv.iglesia_id;
end;
$$;

revoke execute on function public.guardar_iglesia from public, anon;
revoke execute on function public.generar_codigo from public, anon;
revoke execute on function public.unirse_con_codigo from public, anon;
grant execute on function public.guardar_iglesia to authenticated;
grant execute on function public.generar_codigo to authenticated;
grant execute on function public.unirse_con_codigo to authenticated;
