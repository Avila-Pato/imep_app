-- Aviso "Actualiza la app": aqui se dice que version pide cada plataforma.
--   minima:   la app mas vieja que todavia sirve. Si la instalada es menor,
--             el aviso es OBLIGATORIO (no se puede seguir sin actualizar)
--   sugerida: la mas nueva. Si la instalada es menor, el aviso se puede
--             dejar para despues ("Mas tarde")
--   mensaje:  lo que trae la version nueva (opcional, se muestra en el aviso)
-- Se cambia a mano desde Supabase (Table Editor o SQL) al publicar una
-- version nueva en la tienda. La app solo la lee
create table public.version_app (
  plataforma text primary key check (plataforma in ('android', 'ios')),
  minima text not null default '0.0.0' check (minima ~ '^\d+\.\d+\.\d+$'),
  sugerida text not null default '0.0.0' check (sugerida ~ '^\d+\.\d+\.\d+$'),
  mensaje text check (mensaje is null or char_length(mensaje) <= 300),
  actualizado timestamptz not null default now()
);

insert into public.version_app (plataforma) values ('android'), ('ios');

alter table public.version_app enable row level security;
grant select on public.version_app to anon, authenticated;

-- todos la leen (aun sin sesion); nadie la escribe desde la app
create policy "todos leen la version" on public.version_app
  for select to anon, authenticated using (true);
