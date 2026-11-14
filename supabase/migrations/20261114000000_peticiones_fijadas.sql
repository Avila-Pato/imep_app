-- El pastor puede "mantener en el muro" una peticion: no vence a las 24 h
-- (ni la borra la limpieza diaria) hasta que la suelte o la quite
alter table public.peticiones add column fijada boolean not null default false;

create function public.fijar_peticion(p_id uuid, p_fijada boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.peticiones
     set fijada = p_fijada,
         -- al soltarla corren 24 h desde ahora (no desaparece de golpe)
         revisado = case when p_fijada then revisado else now() end
   where id = p_id
     and estado = 'aprobada'
     and public.puede(iglesia_id, 'salas');
  if not found then
    raise exception 'no puedes cambiar esta peticion';
  end if;
end $$;
revoke execute on function public.fijar_peticion from public, anon;
grant execute on function public.fijar_peticion to authenticated;
