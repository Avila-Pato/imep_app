-- El lider de la sala la administra: cambia su nombre, descripcion, foto,
-- icono, color, lo que tiene (chat, oracion, palabra) y sus ajustes. NO
-- cambia quien es el lider ni la borra (eso lo hace el pastor). Sus
-- ayudantes tampoco editan la sala (solo la guian en el dia a dia)
create function public.editar_mi_sala(
  p_iglesia uuid, p_sala text, p_datos jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_label text := nullif(trim(p_datos ->> 'label'), '');
begin
  if not (
    public.puede(p_iglesia, 'salas')
    or public.guia_la_sala(p_iglesia, p_sala, false)
  ) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if p_sala = 'general' then
    raise exception 'la sala de la iglesia la edita el pastor' using errcode = '42501';
  end if;
  if v_label is not null and char_length(v_label) > 60 then
    raise exception 'nombre muy largo';
  end if;
  if p_datos ? 'funciones' and jsonb_typeof(p_datos -> 'funciones') <> 'object' then
    raise exception 'funciones no validas';
  end if;

  update public.salas set
    label        = coalesce(v_label, label),
    descripcion  = coalesce(left(p_datos ->> 'descripcion', 200), descripcion),
    icono        = coalesce(nullif(p_datos ->> 'icono', ''), icono),
    tono         = case when p_datos ? 'tono' then p_datos ->> 'tono' else tono end,
    funciones    = coalesce(p_datos -> 'funciones', funciones),
    tipo         = case when p_datos ? 'tipo' then p_datos ->> 'tipo' else tipo end,
    -- la foto: https (la sube la app antes) o null para quitarla
    foto         = case when p_datos ? 'foto' then nullif(p_datos ->> 'foto', '') else foto end,
    solo_lider   = coalesce((p_datos ->> 'solo_lider')::boolean, solo_lider),
    letra_grande = coalesce((p_datos ->> 'letra_grande')::boolean, letra_grande)
  where iglesia_id = p_iglesia and id = p_sala;
  if not found then
    raise exception 'sala no encontrada';
  end if;
end;
$$;
revoke execute on function public.editar_mi_sala from public, anon;
grant execute on function public.editar_mi_sala to authenticated;
