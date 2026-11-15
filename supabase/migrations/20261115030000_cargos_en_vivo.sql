-- Roles y permisos (cargos) en vivo: cuando el pastor da o quita un rol, el
-- telefono del hermano se entera al instante (y puede editar lo que le toca)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cargos'
  ) then
    alter publication supabase_realtime add table public.cargos;
  end if;
end $$;
