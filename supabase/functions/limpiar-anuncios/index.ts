// Cada madrugada (pg_cron): borra los anuncios y eventos cuya fecha ya paso
// (hora de Chile) y sus fotos en Storage. En la app ya no se ven desde el
// dia siguiente; esto ademas los saca del servidor.
// La llama solo el cron, con el secreto CRON_SECRET en Authorization
import { admin, json } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const secreto = Deno.env.get("CRON_SECRET");
  if (!secreto || req.headers.get("Authorization") !== `Bearer ${secreto}`) {
    return json({ error: "no autorizado" }, 401);
  }

  // "hoy" en Chile (YYYY-MM-DD): se borra lo de antes de hoy
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Santiago",
  });
  const db = admin();
  const { data: viejos, error } = await db
    .from("anuncios")
    .delete()
    .lt("fecha", hoy)
    .select("id, imagen");
  if (error) return json({ error: error.message }, 500);

  const rutas = (viejos ?? [])
    .map((a: { imagen: string | null }) =>
      a.imagen?.split("/object/public/anuncios/")[1],
    )
    .filter((r): r is string => !!r)
    .map((r) => decodeURIComponent(r));
  if (rutas.length) {
    const { error: e2 } = await db.storage.from("anuncios").remove(rutas);
    if (e2) return json({ error: e2.message, borrados: viejos?.length }, 500);
  }
  return json({ borrados: viejos?.length ?? 0, fotos: rutas.length });
});
