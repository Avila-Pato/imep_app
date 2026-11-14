// Cada madrugada (pg_cron): borra los anuncios y eventos cuya fecha ya paso
// (hora de Chile) y sus fotos en Storage. En la app ya no se ven desde el
// dia siguiente; esto ademas los saca del servidor.
// Tambien limpia las peticiones de oracion: las aprobadas al pasar sus 24 h
// en el muro, las rechazadas al dia siguiente y las que nadie reviso en 7 dias.
// Y las notas de voz de los chats de mas de 3 meses (el texto se queda)
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
    .map(
      (a: { imagen: string | null }) =>
        a.imagen?.split("/object/public/anuncios/")[1],
    )
    .filter((r): r is string => !!r)
    .map((r) => decodeURIComponent(r));
  if (rutas.length) {
    const { error: e2 } = await db.storage.from("anuncios").remove(rutas);
    if (e2) return json({ error: e2.message, borrados: viejos?.length }, 500);
  }

  // Peticiones de oracion
  const hace = (horas: number) =>
    new Date(Date.now() - horas * 3600e3).toISOString();
  const [aprobadas, rechazadas, olvidadas] = await Promise.all([
    db
      .from("peticiones")
      .delete()
      .eq("estado", "aprobada")
      .eq("fijada", false)
      .lt("revisado", hace(24))
      .select("id"),
    db
      .from("peticiones")
      .delete()
      .eq("estado", "rechazada")
      .lt("revisado", hace(24))
      .select("id"),
    db
      .from("peticiones")
      .delete()
      .eq("estado", "pendiente")
      .lt("creado", hace(24 * 7))
      .select("id"),
  ]);
  const errorPeticiones =
    aprobadas.error ?? rechazadas.error ?? olvidadas.error;
  if (errorPeticiones) {
    return json({ error: errorPeticiones.message }, 500);
  }

  // Notas de voz de mas de 3 meses: se borra el audio (lo que ocupa
  // espacio) y el mensaje queda con "nota de voz vencida". El texto se queda
  type ConAudio = {
    id: string;
    datos: { audio?: { uri?: string } } & Record<string, unknown>;
  };
  const limite = hace(24 * 90);
  const [salas, privados] = await Promise.all([
    db
      .from("mensajes")
      .select("id, datos")
      .lt("creado", limite)
      .not("datos->audio", "is", null),
    db
      .from("privados")
      .select("id, datos")
      .lt("creado", limite)
      .not("datos->audio", "is", null),
  ]);
  const errorChats = salas.error ?? privados.error;
  if (errorChats) return json({ error: errorChats.message }, 500);
  const conAudio = [
    ...(salas.data ?? []).map((m: ConAudio) => ({ ...m, tabla: "mensajes" })),
    ...(privados.data ?? []).map((m: ConAudio) => ({
      ...m,
      tabla: "privados",
    })),
  ];
  const audios = conAudio
    .map((m) => m.datos.audio?.uri?.split("/object/public/chat/")[1])
    .filter((r): r is string => !!r)
    .map((r) => decodeURIComponent(r));
  if (audios.length) {
    const { error: e3 } = await db.storage.from("chat").remove(audios);
    if (e3) return json({ error: e3.message }, 500);
  }
  for (const m of conAudio) {
    const { audio: _audio, ...resto } = m.datos;
    const { error: e4 } = await db
      .from(m.tabla)
      .update({ datos: { ...resto, audioVencido: true } })
      .eq("id", m.id);
    if (e4) return json({ error: e4.message }, 500);
  }

  return json({
    audios: audios.length,
    borrados: viejos?.length ?? 0,
    fotos: rutas.length,
    peticiones:
      (aprobadas.data?.length ?? 0) +
      (rechazadas.data?.length ?? 0) +
      (olvidadas.data?.length ?? 0),
  });
});
