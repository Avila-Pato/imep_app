-- Salas por tipo de grupo (niños, jóvenes, mujeres...): cada una con su
-- foto y sus ajustes
--   tipo:         "ninos", "jovenes", "mujeres"... (como se creo)
--   foto:         imagen de la sala (Storage, siempre https)
--   solo_lider:   en el chat solo escriben el lider y el pastor (ej: niños,
--                 la sala es para avisar a los papas)
--   letra_grande: la sala se ve con letra mas grande (adultos mayores)
alter table public.salas
  add column tipo text,
  add column foto text check (foto is null or foto like 'https://%'),
  add column solo_lider boolean not null default false,
  add column letra_grande boolean not null default false;

-- ¿Puede escribir esta persona en el chat de esa sala? Si la sala es "solo
-- el lider", solo el pastor y el lider (por su nombre, como lo guarda la
-- sala). Las salas que no estan en la tabla (la general) quedan abiertas
create function public.puede_escribir_en_sala(p_iglesia uuid, p_sala text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select not s.solo_lider
        or public.es_pastor(p_iglesia)
        or (
          coalesce(trim(s.lider), '') <> ''
          and exists (
            select 1
            from public.miembros m
            left join public.perfiles p on p.id = m.usuario_id
            where m.iglesia_id = p_iglesia
              and m.usuario_id = auth.uid()
              and lower(trim(coalesce(nullif(trim(p.nombre), ''), m.nombre, '')))
                  = lower(trim(s.lider))
          )
        )
    from public.salas s
    where s.iglesia_id = p_iglesia and s.id = p_sala
  ), true);
$$;
revoke execute on function public.puede_escribir_en_sala from public, anon;
grant execute on function public.puede_escribir_en_sala to authenticated;

-- escribir en el chat: ademas de no estar silenciado, la sala lo permite
drop policy "miembros escriben" on public.mensajes;
create policy "miembros escriben" on public.mensajes
  for insert to authenticated
  with check (
    autor_id = auth.uid() and public.es_miembro(iglesia_id)
    and public.puede_hablar(iglesia_id)
    and public.puede_escribir_en_sala(iglesia_id, sala)
  );
