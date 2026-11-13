// Cada tarde (pg_cron) avisa a quien tiene turno mañana.
// La llama solo el cron, con el secreto CRON_SECRET en Authorization
import { admin, enviar, json } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const secreto = Deno.env.get("CRON_SECRET");
  if (!secreto || req.headers.get("Authorization") !== `Bearer ${secreto}`) {
    return json({ error: "no autorizado" }, 401);
  }

  const { data, error } = await admin().rpc("avisos_turnos_manana", {
    p_zona: "America/Santiago",
  });
  if (error) return json({ error: error.message }, 500);

  type Fila = { token: string; iglesia: string; rol: string; hora: string | null };
  const resultado = await enviar(
    ((data ?? []) as Fila[]).map((t) => ({
      to: t.token,
      title: "Mañana tienes turno 🙌",
      // ej: "Palabra · 19:30 · Iglesia Central"
      body: [t.rol, t.hora, t.iglesia].filter(Boolean).join(" · "),
      data: { url: "/eventos?vista=cronograma" },
    })),
  );
  return json(resultado);
});
