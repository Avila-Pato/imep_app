-- Programa "recordar-turnos" todos los dias a las 23:00 UTC
-- (20:00 en Chile en horario de verano, 19:00 en invierno).
-- Se ejecuta UNA vez en el SQL Editor, despues de desplegar la funcion.
--
-- Antes: Database → Extensions → activar "pg_cron" y "pg_net".
-- Cambia los dos valores de abajo:
--   TU_PROYECTO = el id de tu proyecto (lo que va antes de .supabase.co)
--   TU_CRON_SECRET = el mismo valor que pusiste con
--                    npx supabase secrets set CRON_SECRET=...

select vault.create_secret('https://TU_PROYECTO.supabase.co', 'project_url');
select vault.create_secret('TU_CRON_SECRET', 'cron_secret');

select cron.schedule(
  'recordar-turnos',
  '0 23 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/recordar-turnos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para ver si corrio:   select * from cron.job_run_details order by start_time desc limit 5;
-- Para quitarlo:        select cron.unschedule('recordar-turnos');
