// La app la llama justo despues de publicar un anuncio:
//   supabase.functions.invoke("avisar-anuncio", { body: { anuncio_id } })
// Comprueba que quien llama puede publicar anuncios en esa iglesia y avisa a
// todos los miembros (menos a quien lo publico)
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const { anuncio_id } = await req.json().catch(() => ({}));
  if (typeof anuncio_id !== "string") {
    return json({ error: "falta anuncio_id" }, 400);
  }

  // como la persona que llama: las reglas RLS deciden que puede ver
  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: anuncio } = await usuario
    .from("anuncios")
    .select(
      "id, iglesia_id, categoria, titulo, descripcion, fecha, hora, lugar, iglesias(nombre)",
    )
    .eq("id", anuncio_id)
    .maybeSingle();
  if (!anuncio) return json({ error: "anuncio no encontrado" }, 404);

  const { data: puede } = await usuario.rpc("puede", {
    p_iglesia: anuncio.iglesia_id,
    p_permiso: "anuncios",
  });
  if (!puede) return json({ error: "sin permiso" }, 403);

  const { data: tokens, error } = await admin().rpc("tokens_de_iglesia", {
    p_iglesia: anuncio.iglesia_id,
    p_tipo: "anuncios",
    p_excluir: yo.user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const iglesia =
    (anuncio.iglesias as unknown as { nombre: string } | null)?.nombre ?? "";

  // Evento: "🗓️ Nuevo evento: Retiro" + "sáb 22 nov · 19:30 · Iglesia Central"
  // Otro anuncio: "📣 Titulo" + "descripcion · Iglesia Central"
  // (siempre con la iglesia: un hermano puede estar en varias)
  const esEvento = anuncio.categoria === "evento";
  const cuando = new Date(`${anuncio.fecha}T12:00:00`).toLocaleDateString(
    "es-CL",
    { weekday: "short", day: "numeric", month: "short" },
  );
  const titulo = esEvento
    ? `🗓️ Nuevo evento: ${anuncio.titulo}`
    : `📣 ${anuncio.titulo}`;
  const cuerpo = esEvento
    ? [cuando, anuncio.hora, iglesia]
    : [anuncio.descripcion, iglesia];

  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: titulo,
      body: cuerpo.filter(Boolean).join(" · ").slice(0, 180),
      data: { url: "/eventos?vista=anuncios", iglesia_id: anuncio.iglesia_id },
    })),
  );
  return json(resultado);
});
