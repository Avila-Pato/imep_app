-- Programa "limpiar-anuncios" todos los dias a las 07:00 UTC (madrugada en
-- Chile). Usa los secretos que ya se guardaron en Vault para recordar-turnos
-- (project_url y cron_secret): este archivo no lleva ninguna clave.
-- Se ejecuta UNA vez en el SQL Editor, despues de desplegar la funcion.

select cron.schedule(
  'limpiar-anuncios',
  '0 7 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/limpiar-anuncios',
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
-- Para quitarlo:        select cron.unschedule('limpiar-anuncios');
