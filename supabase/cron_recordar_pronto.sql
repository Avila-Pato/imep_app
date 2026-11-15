-- Programa "recordar-pronto" cada 15 minutos: avisa lo que empieza en las
-- proximas 2 horas (anuncios con hora y turnos). Usa los secretos que ya
-- estan en Vault (project_url y cron_secret): este archivo no lleva claves.
-- Se ejecuta UNA vez, despues de desplegar la funcion.

select cron.schedule(
  'recordar-pronto',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/recordar-pronto',
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
-- Para quitarlo:        select cron.unschedule('recordar-pronto');
