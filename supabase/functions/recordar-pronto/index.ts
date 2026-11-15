// Cada 15 minutos (pg_cron): avisa lo que empieza en las proximas 2 horas
//   anuncio con hora -> a toda su iglesia ("Hoy: Noche de alabanza")
//   turno            -> a esa persona ("Hoy te toca: Palabra 🙌")
// La base de datos anota cada aviso: nunca se manda dos veces.
// La llama solo el cron, con el secreto CRON_SECRET en Authorization
import { admin, enviar, json } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const secreto = Deno.env.get("CRON_SECRET");
  if (!secreto || req.headers.get("Authorization") !== `Bearer ${secreto}`) {
    return json({ error: "no autorizado" }, 401);
  }

  const { data, error } = await admin().rpc("avisos_pronto", {
    p_zona: "America/Santiago",
  });
  if (error) return json({ error: error.message }, 500);

  type Fila = {
    token: string;
    titulo: string;
    cuerpo: string;
    url: string;
    iglesia_id: string;
  };
  const resultado = await enviar(
    ((data ?? []) as Fila[]).map((f) => ({
      to: f.token,
      title: f.titulo,
      body: f.cuerpo,
      data: { url: f.url, iglesia_id: f.iglesia_id },
    })),
  );
  return json(resultado);
});
