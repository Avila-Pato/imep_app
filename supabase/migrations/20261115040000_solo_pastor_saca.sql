-- Sacar a alguien de la iglesia: SOLO el pastor (antes tambien quien tenia
-- el permiso "roles", ej. Secretario/a, que hasta podia sacar al pastor).
-- Cada uno puede salirse solo. Al pastor no lo saca nadie
drop policy "salir o sacar" on public.miembros;
create policy "salir o sacar" on public.miembros
  for delete to authenticated
  using (
    usuario_id = auth.uid()
    or (public.es_pastor(iglesia_id) and rol <> 'pastor')
  );

-- Cambiar a un miembro: el pastor a cualquiera; quien tiene "roles" solo a
-- los hermanos (antes podia tocar la fila del pastor y dejarlo de hermano)
drop policy "admin cambia miembros" on public.miembros;
create policy "admin cambia miembros" on public.miembros
  for update to authenticated
  using (
    public.es_pastor(iglesia_id)
    or (public.puede(iglesia_id, 'roles') and rol = 'hermano')
  )
  with check (rol = 'hermano' or public.es_pastor(iglesia_id));
