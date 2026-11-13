-- Notificaciones push a otros telefonos (Expo Push)
-- - dispositivos: el token push de cada telefono y que avisos quiere
-- - avisar-anuncio (Edge Function): al publicar un anuncio avisa a la iglesia
-- - recordar-turnos (Edge Function + pg_cron): cada tarde avisa los turnos
--   de mañana

-- ───────────────────────── Dispositivos ─────────────────────────

create table public.dispositivos (
  token text primary key check (token ~ '^Expo(nent)?PushToken\[.+\]$'),
  usuario_id uuid not null default auth.uid() references auth.users on delete cascade,
  plataforma text,
  -- lo mismo que "avisos" en la app: { "anuncios": false } = no quiere esos
  avisos jsonb not null default '{}',
  actualizado timestamptz not null default now()
);
create index dispositivos_usuario on public.dispositivos (usuario_id);

alter table public.dispositivos enable row level security;
create policy "mis dispositivos" on public.dispositivos
  for select to authenticated using (usuario_id = auth.uid());
create policy "borrar mis dispositivos" on public.dispositivos
  for delete to authenticated using (usuario_id = auth.uid());

-- Registra (o actualiza) el token de este telefono. Si el telefono cambio
-- de cuenta, el token pasa a la cuenta nueva
create function public.registrar_dispositivo(
  p_token text, p_plataforma text default null, p_avisos jsonb default '{}'
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'sin sesion' using errcode = '28000';
  end if;
  insert into public.dispositivos (token, usuario_id, plataforma, avisos)
    values (p_token, auth.uid(), p_plataforma, coalesce(p_avisos, '{}'))
    on conflict (token) do update
      set usuario_id = auth.uid(),
          plataforma = excluded.plataforma,
          avisos = excluded.avisos,
          actualizado = now();
end;
$$;
revoke execute on function public.registrar_dispositivo from public, anon;
grant execute on function public.registrar_dispositivo to authenticated;

-- ───────────────────────── Anuncios y turnos ─────────────────────────

-- nombre de quien publico (para mostrarlo sin buscar su perfil)
alter table public.anuncios add column autor text;

-- un turno por rol en cada culto (la app reemplaza el dia completo)
alter table public.turnos
  add constraint turnos_unico unique (iglesia_id, fecha, rol);
-- como se ve el rol ("Palabra", "Puerta", o una casilla que creo la iglesia)
alter table public.turnos add column rol_nombre text;

-- ───────────────────────── A quien avisar ─────────────────────────
-- Solo las Edge Functions (service_role) pueden llamarlas

-- Tokens de los miembros de una iglesia que quieren ese tipo de aviso
create function public.tokens_de_iglesia(
  p_iglesia uuid, p_tipo text, p_excluir uuid default null
) returns table (token text)
language sql stable security definer set search_path = '' as $$
  select d.token
  from public.dispositivos d
  join public.miembros m on m.usuario_id = d.usuario_id
  where m.iglesia_id = p_iglesia
    and d.usuario_id is distinct from p_excluir
    and coalesce((d.avisos ->> p_tipo)::boolean, true);
$$;

-- Turnos de mañana (hora de Chile) con el token de quien sirve. El turno
-- guarda el nombre: se busca al miembro de esa iglesia con ese nombre
create function public.avisos_turnos_manana(p_zona text default 'America/Santiago')
returns table (token text, iglesia text, rol text, hora text, fecha date)
language sql stable security definer set search_path = '' as $$
  select d.token, i.nombre, coalesce(t.rol_nombre, t.rol), t.hora, t.fecha
  from public.turnos t
  join public.iglesias i on i.id = t.iglesia_id
  join public.miembros m on m.iglesia_id = t.iglesia_id
  join public.perfiles p on p.id = m.usuario_id
    and lower(trim(p.nombre)) = lower(trim(t.persona))
  join public.dispositivos d on d.usuario_id = m.usuario_id
  where t.fecha = (now() at time zone p_zona)::date + 1
    and coalesce((d.avisos ->> 'turnos')::boolean, true);
$$;

revoke execute on function public.tokens_de_iglesia from public, anon, authenticated;
revoke execute on function public.avisos_turnos_manana from public, anon, authenticated;
grant execute on function public.tokens_de_iglesia to service_role;
grant execute on function public.avisos_turnos_manana to service_role;

-- Borra tokens que Expo dice que ya no sirven (app desinstalada)
create function public.borrar_tokens(p_tokens text[]) returns void
language sql security definer set search_path = '' as $$
  delete from public.dispositivos where token = any (p_tokens);
$$;
revoke execute on function public.borrar_tokens from public, anon, authenticated;
grant execute on function public.borrar_tokens to service_role;
