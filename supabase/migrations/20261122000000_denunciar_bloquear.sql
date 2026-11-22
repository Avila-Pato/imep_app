-- Denunciar y bloquear (lo exige Google Play a las apps con chat).
-- - Bloquear: cada persona bloquea a otra. No ve sus mensajes en las salas
--   (eso lo filtra la app) y esa persona ya no le puede escribir en privado.
-- - Denunciar: un mensaje de una sala o un privado. La denuncia le llega al
--   pastor de esa iglesia, que la revisa: borra el mensaje, saca a la persona
--   o la marca como revisada.

-- ───────────── Bloqueos ─────────────
create table public.bloqueos (
  usuario_id uuid not null default auth.uid() references auth.users on delete cascade,
  bloqueado uuid not null references auth.users on delete cascade,
  nombre text, -- como se llamaba (para la lista "Bloqueados")
  creado timestamptz not null default now(),
  primary key (usuario_id, bloqueado),
  check (usuario_id <> bloqueado)
);
alter table public.bloqueos enable row level security;

create policy "ver mis bloqueos" on public.bloqueos
  for select to authenticated using (usuario_id = auth.uid());
create policy "bloquear" on public.bloqueos
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "desbloquear" on public.bloqueos
  for delete to authenticated using (usuario_id = auth.uid());

-- quien me bloqueo ya no me puede escribir en privado: su mensaje no se
-- guarda (sin error, como en WhatsApp: no se entera de que lo bloquearon)
create function public.privado_no_bloqueado() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.bloqueos
    where usuario_id = new.para and bloqueado = new.de
  ) then
    return null;
  end if;
  return new;
end;
$$;
create trigger privado_no_bloqueado before insert on public.privados
  for each row execute function public.privado_no_bloqueado();

-- ───────────── Denuncias ─────────────
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  iglesia_id uuid not null references public.iglesias on delete cascade,
  denunciante uuid references auth.users on delete set null,
  denunciante_nombre text,
  autor_id uuid references auth.users on delete set null,
  autor text, -- nombre de quien lo escribio
  tipo text not null check (tipo in ('mensaje', 'privado')),
  ref_id uuid not null, -- el mensaje denunciado
  sala text,
  texto text, -- copia del mensaje (por si se borra)
  motivo text not null,
  creada timestamptz not null default now(),
  revisada boolean not null default false,
  unique (denunciante, tipo, ref_id)
);
create index denuncias_iglesia on public.denuncias (iglesia_id, revisada, creada desc);
alter table public.denuncias enable row level security;

-- las ve el pastor de esa iglesia (y quien denuncio, las suyas)
create policy "ver denuncias" on public.denuncias
  for select to authenticated
  using (denunciante = auth.uid() or public.es_pastor(iglesia_id));
-- se crean y se resuelven solo con las funciones de abajo

-- Denunciar un mensaje que puedo ver. Los datos (autor, texto) los pone el
-- servidor: no se pueden inventar
create function public.denunciar(p_tipo text, p_ref uuid, p_motivo text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_iglesia uuid;
  v_autor_id uuid;
  v_autor text;
  v_sala text;
  v_texto text;
begin
  if auth.uid() is null then raise exception 'sin sesion'; end if;
  if p_tipo = 'mensaje' then
    select m.iglesia_id, m.autor_id, m.autor, m.sala, m.texto
      into v_iglesia, v_autor_id, v_autor, v_sala, v_texto
      from public.mensajes m
      where m.id = p_ref and public.es_miembro(m.iglesia_id);
  elsif p_tipo = 'privado' then
    select p.iglesia_id, p.de, p.autor, null, p.texto
      into v_iglesia, v_autor_id, v_autor, v_sala, v_texto
      from public.privados p
      where p.id = p_ref and p.para = auth.uid();
  else
    raise exception 'tipo invalido';
  end if;
  if v_iglesia is null or v_autor_id = auth.uid() then
    return false;
  end if;
  insert into public.denuncias
    (iglesia_id, denunciante, denunciante_nombre, autor_id, autor, tipo,
     ref_id, sala, texto, motivo)
  values
    (v_iglesia, auth.uid(),
     (select coalesce(nullif(trim(pf.nombre), ''), mb.nombre)
        from public.miembros mb
        left join public.perfiles pf on pf.id = mb.usuario_id
        where mb.iglesia_id = v_iglesia and mb.usuario_id = auth.uid()),
     v_autor_id, v_autor, p_tipo, p_ref, v_sala, left(v_texto, 1000),
     left(coalesce(nullif(trim(p_motivo), ''), 'Otro'), 200))
  on conflict (denunciante, tipo, ref_id) do nothing;
  return true;
end;
$$;
revoke execute on function public.denunciar from public, anon;
grant execute on function public.denunciar to authenticated;

-- El pastor la resuelve: si p_borrar, borra el mensaje denunciado
create function public.resolver_denuncia(p_id uuid, p_borrar boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  d public.denuncias;
begin
  select * into d from public.denuncias where id = p_id;
  if d.id is null or not public.es_pastor(d.iglesia_id) then
    return false;
  end if;
  if p_borrar then
    if d.tipo = 'mensaje' then
      delete from public.mensajes where id = d.ref_id and iglesia_id = d.iglesia_id;
    else
      delete from public.privados where id = d.ref_id and iglesia_id = d.iglesia_id;
    end if;
  end if;
  -- todas las denuncias de ese mismo mensaje quedan revisadas
  update public.denuncias set revisada = true
    where iglesia_id = d.iglesia_id and tipo = d.tipo and ref_id = d.ref_id;
  return true;
end;
$$;
revoke execute on function public.resolver_denuncia from public, anon;
grant execute on function public.resolver_denuncia to authenticated;
