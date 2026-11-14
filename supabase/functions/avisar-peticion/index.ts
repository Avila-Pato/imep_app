// La app la llama en dos momentos:
// 1) justo despues de pedir oracion: { peticion_id }
//    Comprueba que la peticion es de quien llama y que sigue pendiente, y
//    avisa a quienes la aprueban (pastor y lideres)
// 2) cuando el pastor la aprueba: { peticion_id, aprobada: true }
//    Comprueba que quien llama puede aprobar y avisa a quien la pidio
import { createClient } from "npm:@supabase/supabase-js@2";
import { admin, enviar, json, preflight } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const previa = preflight(req); // navegador (web)
  if (previa) return previa;
  if (req.method !== "POST") return json({ error: "solo POST" }, 405);
  const { peticion_id, aprobada } = await req.json().catch(() => ({}));
  if (typeof peticion_id !== "string") {
    return json({ error: "falta peticion_id" }, 400);
  }

  // como la persona que llama: RLS solo le deja ver las suyas (o aprobadas)
  const usuario = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    },
  );
  const { data: yo } = await usuario.auth.getUser();
  if (!yo.user) return json({ error: "sin sesion" }, 401);

  const { data: p } = await usuario
    .from("peticiones")
    .select("id, iglesia_id, autor_id, autor, texto, estado, iglesias(nombre)")
    .eq("id", peticion_id)
    .maybeSingle();
  if (!p) return json({ error: "peticion no encontrada" }, 404);
  const iglesia =
    (p.iglesias as unknown as { nombre: string } | null)?.nombre ?? "";

  // 2) aprobada: aviso a quien la pidio (no si la pidio el mismo pastor)
  if (aprobada === true) {
    const { data: puede } = await usuario.rpc("puede", {
      p_iglesia: p.iglesia_id,
      p_permiso: "salas",
    });
    if (!puede) return json({ error: "sin permiso" }, 403);
    if (p.estado !== "aprobada" || p.autor_id === yo.user.id) {
      return json({ enviados: 0 });
    }
    const { data: dispositivos, error: e1 } = await admin()
      .from("dispositivos")
      .select("token, avisos")
      .eq("usuario_id", p.autor_id);
    if (e1) return json({ error: e1.message }, 500);
    const resultado = await enviar(
      (dispositivos ?? [])
        // respeta si apago los avisos de "Mi sala"
        .filter(
          (d: { avisos: Record<string, boolean> | null }) =>
            d.avisos?.salas !== false,
        )
        .map((d: { token: string }) => ({
          to: d.token,
          title: "🙏 Tu petición fue aprobada",
          body: [
            "Ya está en el muro: los hermanos pueden orar por ti durante 24 horas",
            iglesia,
          ]
            .filter(Boolean)
            .join(" · "),
          data: {
            url: "/sala/general?vista=oracion",
            iglesia_id: p.iglesia_id,
          },
        })),
    );
    return json(resultado);
  }

  // 1) pendiente: solo quien la pidio avisa, y solo si aun espera (no se repite)
  if (p.autor_id !== yo.user.id) return json({ error: "sin permiso" }, 403);
  if (p.estado !== "pendiente") return json({ enviados: 0 });

  const { data: tokens, error } = await admin().rpc("tokens_que_revisan", {
    p_iglesia: p.iglesia_id,
    p_excluir: yo.user.id,
  });
  if (error) return json({ error: error.message }, 500);

  const resultado = await enviar(
    (tokens ?? []).map((t: { token: string }) => ({
      to: t.token,
      title: `🙏 ${p.autor} pide oración`,
      body: [p.texto.slice(0, 120), iglesia, "Toca para aprobarla o rechazarla"]
        .filter(Boolean)
        .join(" · "),
      data: { url: "/sala/general?vista=oracion", iglesia_id: p.iglesia_id },
    })),
  );
  return json(resultado);
});
