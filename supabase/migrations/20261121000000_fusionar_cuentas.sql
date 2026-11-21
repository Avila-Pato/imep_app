-- Unir la cuenta anonima con la de Google.
-- Quien usa la app sin cuenta (anonimo) y despues entra con un Google que YA
-- tenia cuenta (lo uso antes, en este u otro telefono) no puede vincularlo:
-- Supabase entra a la cuenta de Google y lo que hizo como anonimo (iglesias,
-- salas, cronograma, anuncios, mensajes...) se quedaba en la cuenta anonima,
-- que nadie vuelve a abrir. Ahora se pasa todo a la cuenta de Google:
--   1) como anonimo: preparar_fusion() -> un codigo de un solo uso
--   2) ya dentro de Google: fusionar_cuenta(codigo)
-- El codigo prueba que quien pide la fusion era el dueño de la cuenta anonima.

create table public.fusiones (
  codigo uuid primary key default gen_random_uuid(),
  anonimo uuid not null references auth.users on delete cascade,
  creada timestamptz not null default now()
);
alter table public.fusiones enable row level security;
-- sin politicas: solo se usa desde las funciones de abajo

create function public.preparar_fusion()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_codigo uuid;
begin
  if auth.uid() is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is false then
    raise exception 'solo una cuenta anonima';
  end if;
  delete from public.fusiones where anonimo = auth.uid() or creada < now() - interval '1 day';
  insert into public.fusiones (anonimo) values (auth.uid()) returning codigo into v_codigo;
  return v_codigo;
end;
$$;
revoke execute on function public.preparar_fusion from public, anon;
grant execute on function public.preparar_fusion to authenticated;

create function public.fusionar_cuenta(p_codigo uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_yo uuid := auth.uid();
  v_anon uuid;
begin
  if v_yo is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'solo una cuenta con Google';
  end if;

  delete from public.fusiones
    where codigo = p_codigo and creada > now() - interval '30 minutes'
    returning anonimo into v_anon;
  if v_anon is null or v_anon = v_yo then
    return false;
  end if;
  -- solo se absorbe una cuenta que sigue siendo anonima
  if not exists (select 1 from auth.users where id = v_anon and is_anonymous) then
    return false;
  end if;

  -- membresias: las nuevas se copian; si ya era de esa iglesia se queda el
  -- rol mas alto (pastor) y lo que eligio como anonimo
  insert into public.miembros
    (iglesia_id, usuario_id, rol, nombre, sala, unido, sin_chat, sin_oracion)
  select iglesia_id, v_yo, rol, nombre, sala, unido, sin_chat, sin_oracion
  from public.miembros where usuario_id = v_anon
  on conflict (iglesia_id, usuario_id) do update
    set rol = case when excluded.rol = 'pastor' then excluded.rol
                   else public.miembros.rol end,
        sala = coalesce(public.miembros.sala, excluded.sala);
  insert into public.cargos (iglesia_id, usuario_id, cargo)
  select iglesia_id, v_yo, cargo from public.cargos where usuario_id = v_anon
  on conflict do nothing;
  -- (sus cargos de anonimo caen en cascada con la membresia)
  delete from public.miembros where usuario_id = v_anon;

  update public.iglesias set creada_por = v_yo where creada_por = v_anon;
  update public.anuncios set autor_id = v_yo where autor_id = v_anon;
  update public.mensajes set autor_id = v_yo where autor_id = v_anon;
  update public.peticiones set autor_id = v_yo where autor_id = v_anon;
  update public.privados set de = v_yo where de = v_anon;
  update public.privados set para = v_yo where para = v_anon;
  update public.salas set lider_id = v_yo where lider_id = v_anon;
  update public.salas
    set ayudantes_ids = array_replace(ayudantes_ids, v_anon, v_yo)
    where v_anon = any (ayudantes_ids);
  update public.turnos set persona_id = v_yo where persona_id = v_anon;

  -- lo que es "una vez por persona": si ya lo tenia, se queda el suyo
  update public.peticiones_orando o set usuario_id = v_yo
    where o.usuario_id = v_anon and not exists (
      select 1 from public.peticiones_orando x
      where x.peticion_id = o.peticion_id and x.usuario_id = v_yo);
  update public.reacciones r set usuario_id = v_yo
    where r.usuario_id = v_anon and not exists (
      select 1 from public.reacciones x
      where x.mensaje_id = r.mensaje_id and x.usuario_id = v_yo);
  update public.respuestas r set usuario_id = v_yo
    where r.usuario_id = v_anon and not exists (
      select 1 from public.respuestas x
      where x.mensaje_id = r.mensaje_id and x.usuario_id = v_yo);

  -- el perfil: si la cuenta de Google no tenia, se queda el del anonimo
  if not exists (select 1 from public.perfiles where id = v_yo) then
    update public.perfiles set id = v_yo where id = v_anon;
  end if;

  -- la cuenta anonima ya no sirve (lo que quedo cae en cascada; el
  -- telefono se vuelve a registrar para avisos al entrar)
  delete from auth.users where id = v_anon;
  return true;
end;
$$;
revoke execute on function public.fusionar_cuenta from public, anon;
grant execute on function public.fusionar_cuenta to authenticated;
